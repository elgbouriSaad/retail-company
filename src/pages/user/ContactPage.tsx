import React, { useState } from 'react';
import { Send, Phone, Mail, MapPin } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    productReference: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // In a real app, this would send to an API
    console.log('Contact form submitted:', formData);
    
    setShowSuccess(true);
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      productReference: '',
    });

    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
        <p className="text-slate-400">Get in touch with our team for any questions or support</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-6">Get in Touch</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Phone</p>
                <p className="text-slate-400">+1 (555) 123-4567</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Email</p>
                <p className="text-slate-400">support@sewcraft.com</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Address</p>
                <p className="text-slate-400">123 Sewing Street<br />Craft City, CC 12345</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-white font-medium mb-3">Business Hours</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Monday - Friday</span>
                <span className="text-white">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Saturday</span>
                <span className="text-white">10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sunday</span>
                <span className="text-white">Closed</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Form */}
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-6">Send us a Message</h2>

          {showSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-medium">Message sent successfully!</p>
              <p className="text-green-300 text-sm">We'll get back to you as soon as possible.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                placeholder="Your full name"
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <Input
              label="Subject"
              value={formData.subject}
              onChange={(value) => handleInputChange('subject', value)}
              placeholder="What is this regarding?"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Product Reference (Optional)
              </label>
              <select
                value={formData.productReference}
                onChange={(e) => handleInputChange('productReference', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product (optional)</option>
                {mockProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Tell us how we can help you..."
                rows={6}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
            </div>

            <Button
              type="submit"
              icon={Send}
              className="w-full md:w-auto"
            >
              Send Message
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};