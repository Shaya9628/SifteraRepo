import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Phone, MapPin, Sparkles, Heart, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Drop us a line anytime!',
      contact: 'contact@siftera.com',
      gradient: 'from-purple-500 to-pink-500',
      action: () => window.open('mailto:contact@siftera.com')
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our team',
      contact: 'Available 24/7',
      gradient: 'from-cyan-500 to-blue-500',
      action: () => toast({ title: '💬 Chat feature coming soon!', description: 'We\'re working on it!' })
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak directly with our team',
      contact: '+1 (555) 123-4567',
      gradient: 'from-green-500 to-emerald-500',
      action: () => window.open('tel:+15551234567')
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      description: 'Our headquarters',
      contact: 'San Francisco, CA',
      gradient: 'from-orange-500 to-red-500',
      action: () => toast({ title: '🏢 Remote first!', description: 'We love working from anywhere!' })
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: '✨ Message sent!',
      description: 'We\'ll get back to you super soon! 🚀'
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gen Z Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}} />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-neon-pink/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-neon-cyan/20 rounded-full blur-3xl animate-float" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-8 glass hover:glow-purple transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> 
          <span className="font-medium">Back to Home</span>
        </Button>
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6 animate-bounce-slow">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Get in Touch ✨</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient animate-gradient">
            Contact{' '}
            <span className="text-gradient-neon">
              Us
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Have questions? Ideas? Just want to say hi? 
            <br />We'd <span className="emoji-pop">❤️</span> to hear from you!
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactMethods.map((method, index) => (
            <Card 
              key={index} 
              className="glass card-hover hover:glow-purple group cursor-pointer" 
              onClick={method.action}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${method.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                  <method.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gradient">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                <p className="text-sm font-medium text-primary">{method.contact}</p>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="glass-strong glow-cyan border-neon">
            <CardHeader className="text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-bold text-lg mb-4 mx-auto">
                <Heart className="w-5 h-5" />
                Send us a message
              </div>
              <CardTitle className="text-3xl text-gradient-neon">Let's Start a Conversation!</CardTitle>
            </CardHeader>
            
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gradient">Your Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="glass border-primary/30 focus:border-primary focus:glow-purple"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gradient">Email Address</label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@company.com"
                      className="glass border-primary/30 focus:border-primary focus:glow-purple"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gradient">Subject</label>
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="What's on your mind?"
                    className="glass border-primary/30 focus:border-primary focus:glow-purple"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gradient">Message</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us more about how we can help..."
                    className="glass border-primary/30 focus:border-primary focus:glow-purple min-h-[120px]"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full text-lg py-6 bg-gradient-primary hover:bg-gradient-neon glow-purple hover:glow-cyan transition-all duration-300 font-bold"
                >
                  <Zap className="mr-2 w-5 h-5" />
                  Send Message ✨
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Fun Footer */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground text-lg">
            Or just email us at{' '}
            <a 
              href="mailto:contact@siftera.com" 
              className="text-gradient font-bold hover:text-glow transition-all duration-300"
            >
              contact@siftera.com
            </a>
            {' '}for instant replies! <span className="emoji-pop">⚡</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
