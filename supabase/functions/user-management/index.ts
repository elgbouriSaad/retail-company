import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with SERVICE_ROLE_KEY for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create client with user's token for verification
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Verify the user's token and get their info
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current user's profile to check permissions
    const { data: currentUserData, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !currentUserData) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isAdmin = currentUserData.role === 'ADMIN'

    // Handle PATCH method for partial updates
    if (req.method === 'PATCH') {
      const body = await req.json()
      const { userId, email, password, name, phone, address } = body

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Users can only update themselves, admins can update anyone
      if (!isAdmin && userId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: You can only update your own profile' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if email is already in use by another user
      if (email) {
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', email)
          .neq('id', userId)
          .maybeSingle()

        if (existingUser) {
          return new Response(
            JSON.stringify({ error: 'Email is already in use by another user' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Build update object for public.users
      const publicUpdate: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }
      if (name) publicUpdate.name = name
      if (email) publicUpdate.email = email
      if (phone !== undefined) publicUpdate.phone = phone
      if (address !== undefined) publicUpdate.address = address

      // Update public.users
      const { error: publicError } = await supabaseAdmin
        .from('users')
        .update(publicUpdate)
        .eq('id', userId)

      if (publicError) {
        console.error('Error updating public.users:', publicError)
        return new Response(
          JSON.stringify({ error: `Failed to update profile: ${publicError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update auth.users if email or password changed
      if (email || password) {
        const authUpdate: Record<string, unknown> = {}
        
        if (email) {
          authUpdate.email = email
          authUpdate.email_confirm = true // Skip email verification
        }
        
        if (password) {
          authUpdate.password = password
        }

        // Update user metadata with name
        if (name) {
          authUpdate.user_metadata = { name }
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          authUpdate
        )

        if (authError) {
          console.error('Error updating auth.users:', authError)
          return new Response(
            JSON.stringify({ 
              error: `Profile updated but auth sync failed: ${authError.message}`,
              partialSuccess: true 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User updated successfully',
          emailChanged: !!email,
          passwordChanged: !!password
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle PUT method for full updates (admin only)
    if (req.method === 'PUT') {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Only admins can perform full user updates' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const body = await req.json()
      const { userId, email, name, role, password } = body

      if (!userId || !email || !name || !role) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: userId, email, name, role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check email uniqueness
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .maybeSingle()

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'Email is already in use' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update public.users
      const { error: publicError } = await supabaseAdmin
        .from('users')
        .update({
          name,
          email,
          role: role.toUpperCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (publicError) {
        return new Response(
          JSON.stringify({ error: `Failed to update profile: ${publicError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update auth.users
      const authUpdate: Record<string, unknown> = {
        email,
        email_confirm: true,
        user_metadata: { name, role }
      }

      if (password) {
        authUpdate.password = password
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        authUpdate
      )

      if (authError) {
        return new Response(
          JSON.stringify({ 
            error: `Profile updated but auth sync failed: ${authError.message}`,
            partialSuccess: true 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use PATCH or PUT.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

