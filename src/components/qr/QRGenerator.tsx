import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { HexColorPicker } from 'react-colorful';
import { 
  Download, 
  Share2, 
  Copy, 
  Palette, 
  Settings, 
  Type, 
  Link2, 
  User, 
  Wifi, 
  Mail, 
  Phone,
  Sparkles,
  Upload,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

interface QRConfig {
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  width: number;
  logo?: string;
  logoSize: number;
  gradientType: 'none' | 'linear' | 'radial';
  gradientColors: string[];
}

interface QRData {
  type: 'text' | 'url' | 'contact' | 'wifi' | 'email' | 'phone' | 'sms';
  content: string;
  metadata?: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    ssid?: string;
    password?: string;
    encryption?: string;
    subject?: string;
    body?: string;
  };
}

const QRGenerator: React.FC = () => {
  const [qrData, setQrData] = useState<QRData>({
    type: 'text',
    content: 'Hello, World! 👋'
  });
  
  const [qrConfig, setQrConfig] = useState<QRConfig>({
    foregroundColor: '#8B5CF6',
    backgroundColor: '#ffffff',
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 400,
    logoSize: 0.2,
    gradientType: 'none',
    gradientColors: ['#8B5CF6', '#06B6D4']
  });

  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState<'fg' | 'bg' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code
  const generateQRCode = async () => {
    if (!qrData.content.trim()) return;
    
    setIsGenerating(true);
    
    try {
      let content = qrData.content;
      
      // Format content based on type
      switch (qrData.type) {
        case 'contact':
          content = `BEGIN:VCARD
VERSION:3.0
FN:${qrData.metadata?.name || ''}
ORG:${qrData.metadata?.organization || ''}
TEL:${qrData.metadata?.phone || ''}
EMAIL:${qrData.metadata?.email || ''}
END:VCARD`;
          break;
        case 'wifi':
          content = `WIFI:T:${qrData.metadata?.encryption || 'WPA'};S:${qrData.metadata?.ssid || ''};P:${qrData.metadata?.password || ''};H:false;;`;
          break;
        case 'email':
          content = `mailto:${qrData.content}?subject=${qrData.metadata?.subject || ''}&body=${qrData.metadata?.body || ''}`;
          break;
        case 'phone':
          content = `tel:${qrData.content}`;
          break;
        case 'sms':
          content = `sms:${qrData.content}?body=${qrData.metadata?.body || ''}`;
          break;
      }

      const dataURL = await QRCode.toDataURL(content, {
        errorCorrectionLevel: qrConfig.errorCorrectionLevel,
        margin: qrConfig.margin,
        width: qrConfig.width,
        color: {
          dark: qrConfig.foregroundColor,
          light: qrConfig.backgroundColor
        }
      });

      setQrCodeDataURL(dataURL);
      
      // Show success animation
      toast({
        title: "QR Code Generated! ✨",
        description: "Your beautiful QR code is ready to download or share.",
      });
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating your QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate when data changes
  useEffect(() => {
    if (qrData.content.trim()) {
      const debounce = setTimeout(generateQRCode, 300);
      return () => clearTimeout(debounce);
    }
  }, [qrData, qrConfig]);

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeDataURL) return;
    
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = qrCodeDataURL;
    link.click();
    
    toast({
      title: "Download Started! 📥",
      description: "Your QR code is being downloaded.",
    });
  };

  // Share QR code
  const shareQRCode = async () => {
    if (!qrCodeDataURL) return;
    
    try {
      if (navigator.share) {
        const response = await fetch(qrCodeDataURL);
        const blob = await response.blob();
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });
        
        await navigator.share({
          title: 'My QR Code',
          files: [file]
        });
      } else {
        // Fallback to copy
        await navigator.clipboard.writeText(qrCodeDataURL);
        toast({
          title: "Copied to Clipboard! 📋",
          description: "QR code data URL copied to clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Unable to share QR code. Please try downloading instead.",
        variant: "destructive"
      });
    }
  };

  // Copy QR code
  const copyQRCode = async () => {
    if (!qrCodeDataURL) return;
    
    try {
      await navigator.clipboard.writeText(qrData.content);
      toast({
        title: "Copied! 📋",
        description: "QR code content copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy QR code content.",
        variant: "destructive"
      });
    }
  };

  const dataTypeIcons = {
    text: Type,
    url: Link2,
    contact: User,
    wifi: Wifi,
    email: Mail,
    phone: Phone,
    sms: Phone
  };

  return (
    <div className="min-h-screen bg-gradient-bg p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl lg:text-6xl font-bold gradient-text mb-4">
            QR Generator Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create stunning, customizable QR codes with advanced styling options and instant preview
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Data Input */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Content & Data Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={qrData.type} onValueChange={(value) => setQrData(prev => ({ ...prev, type: value as any, content: '' }))}>
                  <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                    {Object.entries(dataTypeIcons).map(([type, Icon]) => (
                      <TabsTrigger key={type} value={type} className="flex items-center gap-1">
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline capitalize">{type}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <Label htmlFor="text-content">Text Content</Label>
                      <Textarea
                        id="text-content"
                        placeholder="Enter your text here..."
                        value={qrData.content}
                        onChange={(e) => setQrData(prev => ({ ...prev, content: e.target.value }))}
                        className="min-h-[100px]"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="url-content">Website URL</Label>
                      <Input
                        id="url-content"
                        type="url"
                        placeholder="https://example.com"
                        value={qrData.content}
                        onChange={(e) => setQrData(prev => ({ ...prev, content: e.target.value }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          placeholder="John Doe"
                          value={qrData.metadata?.name || ''}
                          onChange={(e) => setQrData(prev => ({ 
                            ...prev, 
                            content: e.target.value,
                            metadata: { ...prev.metadata, name: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Organization</Label>
                        <Input
                          placeholder="Company Inc."
                          value={qrData.metadata?.organization || ''}
                          onChange={(e) => setQrData(prev => ({ 
                            ...prev, 
                            metadata: { ...prev.metadata, organization: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          placeholder="+1 (555) 123-4567"
                          value={qrData.metadata?.phone || ''}
                          onChange={(e) => setQrData(prev => ({ 
                            ...prev, 
                            metadata: { ...prev.metadata, phone: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={qrData.metadata?.email || ''}
                          onChange={(e) => setQrData(prev => ({ 
                            ...prev, 
                            metadata: { ...prev.metadata, email: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="wifi" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Network Name (SSID)</Label>
                        <Input
                          placeholder="MyWiFiNetwork"
                          value={qrData.metadata?.ssid || ''}
                          onChange={(e) => setQrData(prev => ({ 
                            ...prev, 
                            content: e.target.value,
                            metadata: { ...prev.metadata, ssid: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          placeholder="Enter WiFi password"
                          value={qrData.metadata?.password || ''}
                          onChange={(e) => setQrData(prev => ({ 
                            ...prev, 
                            metadata: { ...prev.metadata, password: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Security Type</Label>
                        <Select value={qrData.metadata?.encryption || 'WPA'} onValueChange={(value) => 
                          setQrData(prev => ({ ...prev, metadata: { ...prev.metadata, encryption: value }}))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WPA">WPA/WPA2</SelectItem>
                            <SelectItem value="WEP">WEP</SelectItem>
                            <SelectItem value="nopass">Open (No Password)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4">
                    <div>
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        value={qrData.content}
                        onChange={(e) => setQrData(prev => ({ ...prev, content: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Subject (Optional)</Label>
                      <Input
                        placeholder="Email subject"
                        value={qrData.metadata?.subject || ''}
                        onChange={(e) => setQrData(prev => ({ 
                          ...prev, 
                          metadata: { ...prev.metadata, subject: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Message (Optional)</Label>
                      <Textarea
                        placeholder="Email message..."
                        value={qrData.metadata?.body || ''}
                        onChange={(e) => setQrData(prev => ({ 
                          ...prev, 
                          metadata: { ...prev.metadata, body: e.target.value }
                        }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="phone" className="space-y-4">
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={qrData.content}
                        onChange={(e) => setQrData(prev => ({ ...prev, content: e.target.value }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="sms" className="space-y-4">
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={qrData.content}
                        onChange={(e) => setQrData(prev => ({ ...prev, content: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Message (Optional)</Label>
                      <Textarea
                        placeholder="SMS message..."
                        value={qrData.metadata?.body || ''}
                        onChange={(e) => setQrData(prev => ({ 
                          ...prev, 
                          metadata: { ...prev.metadata, body: e.target.value }
                        }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Style Customization */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-secondary" />
                  Style & Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Foreground Color</Label>
                    <Popover open={showColorPicker === 'fg'} onOpenChange={(open) => setShowColorPicker(open ? 'fg' : null)}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: qrConfig.foregroundColor }}
                          />
                          {qrConfig.foregroundColor}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <HexColorPicker 
                          color={qrConfig.foregroundColor} 
                          onChange={(color) => setQrConfig(prev => ({ ...prev, foregroundColor: color }))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Background Color</Label>
                    <Popover open={showColorPicker === 'bg'} onOpenChange={(open) => setShowColorPicker(open ? 'bg' : null)}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: qrConfig.backgroundColor }}
                          />
                          {qrConfig.backgroundColor}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <HexColorPicker 
                          color={qrConfig.backgroundColor} 
                          onChange={(color) => setQrConfig(prev => ({ ...prev, backgroundColor: color }))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Separator />

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Error Correction</Label>
                    <Select value={qrConfig.errorCorrectionLevel} onValueChange={(value: any) => 
                      setQrConfig(prev => ({ ...prev, errorCorrectionLevel: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Low (7%)</SelectItem>
                        <SelectItem value="M">Medium (15%)</SelectItem>
                        <SelectItem value="Q">Quartile (25%)</SelectItem>
                        <SelectItem value="H">High (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Size (pixels)</Label>
                    <Input
                      type="number"
                      min="200"
                      max="1000"
                      value={qrConfig.width}
                      onChange={(e) => setQrConfig(prev => ({ ...prev, width: parseInt(e.target.value) || 400 }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Margin</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={qrConfig.margin}
                      onChange={(e) => setQrConfig(prev => ({ ...prev, margin: parseInt(e.target.value) || 4 }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* QR Code Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-accent" />
                    Live Preview
                  </span>
                  {isGenerating && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {qrCodeDataURL ? (
                      <motion.div
                        key="qr-code"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center"
                      >
                        <div className="relative inline-block p-4 glass rounded-2xl">
                          <img 
                            src={qrCodeDataURL} 
                            alt="Generated QR Code"
                            className="max-w-full h-auto rounded-lg shadow-2xl"
                            style={{ maxWidth: '300px' }}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-16"
                      >
                        <div className="w-32 h-32 mx-auto mb-4 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                          <Type className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground">
                          Enter content above to see QR preview
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                {qrCodeDataURL && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-3 mt-6"
                  >
                    <Button 
                      variant="gradient" 
                      size="lg" 
                      onClick={downloadQRCode}
                      className="w-full"
                    >
                      <Download className="w-4 h-4" />
                      Download PNG
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        onClick={shareQRCode}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={copyQRCode}
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;