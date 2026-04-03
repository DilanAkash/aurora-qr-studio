import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeStyling from 'qr-code-styling';
import { HexColorPicker } from 'react-colorful';
import {
  Download,
  Share2,
  Copy,
  Palette,
  Type,
  Link2,
  User,
  Wifi,
  Mail,
  Phone,
  MessageCircle,
  QrCode,
  Sparkles,
  Upload,
  XCircle,
  Paintbrush
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ui/theme-toggle';

interface QRConfig {
  foregroundColor: string;
  gradientColor?: string;
  backgroundColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  width: number;

  dotsType: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
  cornersSquareType: 'dot' | 'square' | 'extra-rounded';
  cornersDotType: 'dot' | 'square';

  logoImage?: string;
}

interface QRData {
  type: 'text' | 'url' | 'contact' | 'wifi' | 'email' | 'phone' | 'sms' | 'whatsapp';
  content: string;
  metadata?: any;
}

const QRGenerator: React.FC = () => {
  const [qrData, setQrData] = useState<QRData>({
    type: 'url',
    content: 'https://dilanakash.vercel.app/'
  });

  const [qrConfig, setQrConfig] = useState<QRConfig>({
    foregroundColor: '#000000',
    gradientColor: undefined,
    backgroundColor: 'transparent',
    errorCorrectionLevel: 'H',
    margin: 5,
    width: 1000,
    dotsType: 'square',
    cornersSquareType: 'square',
    cornersDotType: 'square',
    logoImage: undefined
  });

  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const qrCodeInst = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !qrCodeInst.current) {
      qrCodeInst.current = new QRCodeStyling({
        width: 1000,
        height: 1000,
        type: "canvas",
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
          imageSize: 0.4
        }
      });
    }
  }, []);

  const generateQRCode = async () => {
    if (!qrData.content.trim() || !qrCodeInst.current) {
      setQrCodeDataURL('');
      return;
    }

    setIsGenerating(true);

    try {
      let content = qrData.content;

      switch (qrData.type) {
        case 'contact':
          const meta = qrData.metadata;
          const fullName = `${meta?.firstName || ''} ${meta?.lastName || ''}`.trim();
          content = `BEGIN:VCARD\nVERSION:3.0\nFN:${fullName}\nN:${meta?.lastName || ''};${meta?.firstName || ''};;;\nORG:${meta?.organization || ''}\nTITLE:${meta?.position || ''}\nTEL;TYPE=WORK:${meta?.phoneWork || ''}\nTEL;TYPE=CELL:${meta?.phoneMobile || ''}\nEMAIL:${meta?.email || ''}\nURL:${meta?.website || ''}\nADR;TYPE=WORK:;;;;;;;${meta?.country || ''}\nNOTE:${meta?.location || ''}\nEND:VCARD`;
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
        case 'whatsapp':
          const phone = qrData.content.replace(/[^0-9]/g, '');
          content = `https://wa.me/${phone}`;
          if (qrData.metadata?.body) {
            content += `?text=${encodeURIComponent(qrData.metadata.body)}`;
          }
          break;
      }

      qrCodeInst.current.update({
        data: content,
        margin: qrConfig.margin,
        qrOptions: {
          errorCorrectionLevel: qrConfig.errorCorrectionLevel
        },
        dotsOptions: {
          type: qrConfig.dotsType,
          color: qrConfig.foregroundColor,
          gradient: qrConfig.gradientColor ? {
            type: 'linear',
            rotation: Math.PI / 4,
            colorStops: [
              { offset: 0, color: qrConfig.foregroundColor },
              { offset: 1, color: qrConfig.gradientColor }
            ]
          } : undefined
        },
        backgroundOptions: {
          color: qrConfig.backgroundColor
        },
        cornersSquareOptions: {
          type: qrConfig.cornersSquareType,
          color: qrConfig.gradientColor ? undefined : qrConfig.foregroundColor // Gradient overrides square colors if not tricky, usually we let it inherit
        },
        cornersDotOptions: {
          type: qrConfig.cornersDotType,
          color: qrConfig.gradientColor ? undefined : qrConfig.foregroundColor
        },
        image: qrConfig.logoImage || undefined
      });

      const blob = await qrCodeInst.current.getRawData("png");
      if (blob) {
        setQrCodeDataURL(URL.createObjectURL(blob));
      }

    } catch (error) {
      toast({ title: "Failed to generate QR", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(generateQRCode, 200);
    return () => clearTimeout(debounce);
  }, [qrData, qrConfig]);

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return;
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = qrCodeDataURL;
    link.click();
    toast({ title: "Exported successfully", description: "Downloaded as High-Res PNG" });
  };

  const copyData = async () => {
    try {
      await navigator.clipboard.writeText(qrData.content);
      toast({ title: "Copied!", description: "Content copied to clipboard" });
    } catch (e) { }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setQrConfig({ ...qrConfig, logoImage: url });
    }
  };

  const applyPreset = (preset: 'minimal' | 'cyber' | 'soft' | 'organic') => {
    switch (preset) {
      case 'minimal':
        setQrConfig({ ...qrConfig, foregroundColor: '#000000', gradientColor: undefined, backgroundColor: 'transparent', dotsType: 'square', cornersSquareType: 'square', cornersDotType: 'square' });
        break;
      case 'cyber':
        setQrConfig({ ...qrConfig, foregroundColor: '#f12711', gradientColor: '#f5af19', backgroundColor: 'transparent', dotsType: 'classy', cornersSquareType: 'extra-rounded', cornersDotType: 'dot' });
        break;
      case 'soft':
        setQrConfig({ ...qrConfig, foregroundColor: '#5B86E5', gradientColor: '#36D1DC', backgroundColor: 'transparent', dotsType: 'rounded', cornersSquareType: 'extra-rounded', cornersDotType: 'dot' });
        break;
      case 'organic':
        setQrConfig({ ...qrConfig, foregroundColor: '#11998e', gradientColor: '#38ef7d', backgroundColor: 'transparent', dotsType: 'extra-rounded', cornersSquareType: 'dot', cornersDotType: 'dot' });
        break;
    }
  };

  const types = [
    { id: 'url', icon: Link2, label: 'URL' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
    { id: 'wifi', icon: Wifi, label: 'Wi-Fi' },
    { id: 'contact', icon: User, label: 'vCard' },
    { id: 'email', icon: Mail, label: 'Email' },
    { id: 'phone', icon: Phone, label: 'Call' },
    { id: 'sms', icon: MessageCircle, label: 'SMS' },
  ] as const;

  return (
    <div className="flex flex-col-reverse md:flex-row h-[100dvh] w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20">

      {/* LEFT PANEL : EDITOR */}
      <div className="w-full md:w-[450px] lg:w-[500px] flex-1 md:flex-none md:h-full flex flex-col border-t md:border-t-0 md:border-r border-border bg-card/30 backdrop-blur-xl z-20 shrink-0 md:shadow-2xl overflow-hidden">

        {/* Editor Header */}
        <div className="h-auto min-h-[4.5rem] py-3 px-6 flex items-center justify-between border-b border-border bg-card shrink-0">
          
          <div className="flex items-center">
            <img src="/black.png" alt="Scan Me Baby Logo" className="h-12 md:h-16 w-auto object-left object-contain block dark:hidden" />
            <img src="/white.png" alt="Scan Me Baby Logo" className="h-12 md:h-16 w-auto object-left object-contain hidden dark:block" />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-muted-foreground font-semibold leading-tight uppercase tracking-wider">
                Developed by
              </span>
              <a
                href="https://dilanakash.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline transition-all font-bold tracking-tight"
              >
                Dilan Akash
              </a>
            </div>
            
            <div className="h-8 w-px bg-border/60 hidden sm:block" />
            
            <ThemeToggle className="text-muted-foreground hover:text-foreground hover:bg-muted" />
          </div>

        </div>

        {/* Editor Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar">

          {/* Section 1: Type Selection */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Format</Label>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {types.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setQrData({ type: t.id, content: '', metadata: {} })}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border transition-all text-xs font-medium",
                    qrData.type === t.id
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-transparent border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px w-full bg-border" />

          {/* Section 2: Data Inputs */}
          <section>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 block">Payload Data</Label>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={qrData.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* URL */}
                {qrData.type === 'url' && (
                  <div className="space-y-2">
                    <Label className="text-sm">URL Destination</Label>
                    <Input
                      type="url"
                      placeholder="https://"
                      value={qrData.content}
                      onChange={(e) => setQrData({ ...qrData, content: e.target.value })}
                      className="h-10 rounded-lg shadow-sm"
                    />
                  </div>
                )}

                {/* Text */}
                {qrData.type === 'text' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Content</Label>
                    <Textarea
                      placeholder="Plain text goes here..."
                      value={qrData.content}
                      onChange={(e) => setQrData({ ...qrData, content: e.target.value })}
                      className="min-h-[120px] rounded-lg shadow-sm resize-none"
                    />
                  </div>
                )}

                {/* WhatsApp */}
                {qrData.type === 'whatsapp' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm">Phone Number</Label>
                      <Input
                        type="tel"
                        placeholder="With country code..."
                        value={qrData.content}
                        onChange={(e) => setQrData({ ...qrData, content: e.target.value })}
                        className="h-10 rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Pre-filled Message</Label>
                      <Textarea
                        placeholder="Optional message..."
                        value={qrData.metadata?.body || ''}
                        onChange={(e) => setQrData({ ...qrData, metadata: { ...qrData.metadata, body: e.target.value } })}
                        className="min-h-[80px] rounded-lg shadow-sm resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Wi-Fi */}
                {qrData.type === 'wifi' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">SSID (Network Name)</Label>
                      <Input
                        value={qrData.metadata?.ssid || ''}
                        onChange={(e) => setQrData({ ...qrData, metadata: { ...qrData.metadata, ssid: e.target.value }, content: e.target.value })}
                        className="h-10 rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Password</Label>
                      <Input
                        type="password"
                        value={qrData.metadata?.password || ''}
                        onChange={(e) => setQrData({ ...qrData, metadata: { ...qrData.metadata, password: e.target.value } })}
                        className="h-10 rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Encryption</Label>
                      <Select value={qrData.metadata?.encryption || 'WPA'} onValueChange={(val) => setQrData({ ...qrData, metadata: { ...qrData.metadata, encryption: val } })}>
                        <SelectTrigger className="h-10 rounded-lg shadow-sm"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="WPA">WPA/WPA2</SelectItem><SelectItem value="WEP">WEP</SelectItem><SelectItem value="nopass">None</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Email */}
                {qrData.type === 'email' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">To</Label>
                      <Input
                        type="email"
                        value={qrData.content}
                        onChange={(e) => setQrData({ ...qrData, content: e.target.value })}
                        className="h-10 rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Subject</Label>
                      <Input
                        value={qrData.metadata?.subject || ''}
                        onChange={(e) => setQrData({ ...qrData, metadata: { ...qrData.metadata, subject: e.target.value } })}
                        className="h-10 rounded-lg shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Body</Label>
                      <Textarea
                        value={qrData.metadata?.body || ''}
                        onChange={(e) => setQrData({ ...qrData, metadata: { ...qrData.metadata, body: e.target.value } })}
                        className="min-h-[100px] rounded-lg shadow-sm resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Phone & SMS */}
                {(qrData.type === 'sms' || qrData.type === 'phone') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Phone</Label>
                      <Input
                        type="tel"
                        value={qrData.content}
                        onChange={(e) => setQrData({ ...qrData, content: e.target.value })}
                        className="h-10 rounded-lg shadow-sm"
                      />
                    </div>
                    {qrData.type === 'sms' && (
                      <div className="space-y-2">
                        <Label className="text-sm">Message</Label>
                        <Textarea
                          value={qrData.metadata?.body || ''}
                          onChange={(e) => setQrData({ ...qrData, metadata: { ...qrData.metadata, body: e.target.value } })}
                          className="min-h-[80px] rounded-lg shadow-sm resize-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Contact (vCard) */}
                {qrData.type === 'contact' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1 space-y-2">
                      <Label className="text-sm">First Name</Label>
                      <Input value={qrData.metadata?.firstName || ''} onChange={(e) => setQrData({ ...qrData, content: 'contact', metadata: { ...qrData.metadata, firstName: e.target.value } })} className="h-10 rounded-lg shadow-sm" />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label className="text-sm">Last Name</Label>
                      <Input value={qrData.metadata?.lastName || ''} onChange={(e) => setQrData({ ...qrData, content: 'contact', metadata: { ...qrData.metadata, lastName: e.target.value } })} className="h-10 rounded-lg shadow-sm" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-sm">Organization</Label>
                      <Input value={qrData.metadata?.organization || ''} onChange={(e) => setQrData({ ...qrData, content: 'contact', metadata: { ...qrData.metadata, organization: e.target.value } })} className="h-10 rounded-lg shadow-sm" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-sm">Mobile</Label>
                      <Input value={qrData.metadata?.phoneMobile || ''} onChange={(e) => setQrData({ ...qrData, content: 'contact', metadata: { ...qrData.metadata, phoneMobile: e.target.value } })} className="h-10 rounded-lg shadow-sm" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-sm">Email</Label>
                      <Input type="email" value={qrData.metadata?.email || ''} onChange={(e) => setQrData({ ...qrData, content: 'contact', metadata: { ...qrData.metadata, email: e.target.value } })} className="h-10 rounded-lg shadow-sm" />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          <div className="h-px w-full bg-border" /> {/* Divider */}

          {/* Section 3: Professional Appearance Customizer */}
          <section className="bg-muted/30 p-5 rounded-2xl border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Paintbrush className="w-4 h-4 text-muted-foreground" />
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Pro Customizer</Label>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => applyPreset('minimal')}>Minimal</Button>
              <Button variant="outline" size="sm" className="text-xs border-orange-500/50 text-orange-600 dark:text-orange-400" onClick={() => applyPreset('cyber')}>Cyber</Button>
              <Button variant="outline" size="sm" className="text-xs border-blue-400/50 text-blue-500" onClick={() => applyPreset('soft')}>Soft</Button>
              <Button variant="outline" size="sm" className="text-xs border-green-500/50 text-green-600" onClick={() => applyPreset('organic')}>Organic</Button>
            </div>

            <div className="space-y-5">

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Foreground Pattern Shape</Label>
                  <Select value={qrConfig.dotsType} onValueChange={(val: any) => setQrConfig({ ...qrConfig, dotsType: val })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Standard Square</SelectItem>
                      <SelectItem value="rounded">Rounded</SelectItem>
                      <SelectItem value="dots">Dots</SelectItem>
                      <SelectItem value="classy">Classy</SelectItem>
                      <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
                      <SelectItem value="extra-rounded">Liquid Rounded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 space-y-2">
                  <Label className="text-xs">Corner Frame Shape</Label>
                  <Select value={qrConfig.cornersSquareType} onValueChange={(val: any) => setQrConfig({ ...qrConfig, cornersSquareType: val })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="extra-rounded">Rounded Inner</SelectItem>
                      <SelectItem value="dot">Dot Focus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 space-y-2">
                  <Label className="text-xs">Corner Dot Shape</Label>
                  <Select value={qrConfig.cornersDotType} onValueChange={(val: any) => setQrConfig({ ...qrConfig, cornersDotType: val })}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="dot">Dot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logo Injector */}
              <div className="space-y-2">
                <Label className="text-xs">Center Logo Upload</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="h-9 flex-1 relative overflow-hidden text-xs">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Upload className="w-3 h-3 mr-2" /> {qrConfig.logoImage ? "Replace Logo" : "Upload Logo"}
                  </Button>
                  {qrConfig.logoImage && (
                    <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => setQrConfig({ ...qrConfig, logoImage: undefined })}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-px w-full bg-border/50" />

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Main Color (Gradient Start)</Label>
                  <Popover>
                    <PopoverTrigger className="flex items-center gap-2 border border-border rounded-md px-2 py-1 bg-background shadow-sm hover:bg-muted text-xs font-mono transition-colors">
                      <div className="w-3 h-3 rounded-full border border-border mt-[1px]" style={{ backgroundColor: qrConfig.foregroundColor }} />
                      {qrConfig.foregroundColor}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-border z-50">
                      <HexColorPicker color={qrConfig.foregroundColor} onChange={(clr) => setQrConfig({ ...qrConfig, foregroundColor: clr })} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">Gradient End <span className="opacity-50">(Optional)</span></Label>
                  <div className="flex items-center gap-2">
                    {qrConfig.gradientColor && (
                      <XCircle className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-destructive" onClick={() => setQrConfig({ ...qrConfig, gradientColor: undefined })} />
                    )}
                    <Popover>
                      <PopoverTrigger className="flex items-center gap-2 border border-border rounded-md px-2 py-1 bg-background shadow-sm hover:bg-muted text-xs font-mono transition-colors">
                        <div className="w-3 h-3 rounded-full border border-border mt-[1px]" style={{ backgroundColor: qrConfig.gradientColor || '#transparent' }} />
                        {qrConfig.gradientColor || 'None'}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-border z-50">
                        <HexColorPicker color={qrConfig.gradientColor || '#000000'} onChange={(clr) => setQrConfig({ ...qrConfig, gradientColor: clr })} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Background Color</Label>
                  <div className="flex items-center gap-2">
                    {qrConfig.backgroundColor !== 'transparent' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground"
                        onClick={() => setQrConfig({ ...qrConfig, backgroundColor: 'transparent' })}
                      >
                        Clear
                      </Button>
                    )}
                    <Popover>
                      <PopoverTrigger className="flex items-center gap-2 border border-border rounded-md px-2 py-1 bg-background shadow-sm hover:bg-muted text-xs font-mono transition-colors">
                        <div
                          className="w-3 h-3 rounded-full border border-border mt-[1px]"
                          style={{
                            backgroundColor: qrConfig.backgroundColor === 'transparent' ? 'transparent' : qrConfig.backgroundColor,
                            backgroundImage: qrConfig.backgroundColor === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%, #ccc 50% 75%, transparent 75% 100%)' : 'none',
                            backgroundSize: '4px 4px'
                          }}
                        />
                        {qrConfig.backgroundColor === 'transparent' ? 'Transparent' : qrConfig.backgroundColor}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-border z-50">
                        <HexColorPicker color={qrConfig.backgroundColor === 'transparent' ? '#ffffff' : qrConfig.backgroundColor} onChange={(clr) => setQrConfig({ ...qrConfig, backgroundColor: clr })} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>

      {/* RIGHT PANEL : CANVAS (Preview) */}
      <div className="h-[40vh] md:h-full md:flex-1 relative bg-secondary/50 flex flex-col items-center justify-center isolate overflow-hidden shrink-0">

        {/* Subtle dot grid background for the "Canvas" feel */}
        <div
          className="absolute inset-0 z-[-1] opacity-40 dark:opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentcolor 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />

        {/* Canvas Toolbar */}
        <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
          <Button variant="outline" className="bg-background/80 backdrop-blur shadow-sm h-9 px-3 gap-2" onClick={copyData} disabled={!qrCodeDataURL}>
            <Copy className="w-4 h-4" /> <span className="hidden xl:inline">Copy Data</span>
          </Button>
          <Button className="h-9 shadow-md gap-2" onClick={downloadQRCode} disabled={!qrCodeDataURL}>
            <Download className="w-4 h-4" /> Export High-Res PNG
          </Button>
        </div>

        {/* The Output Frame */}
        <AnimatePresence mode="wait">
          {qrCodeDataURL ? (
            <motion.div
              key="output"
              initial={{ scale: 0.95, opacity: 0, filter: 'blur(4px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.3 }}
              className="bg-white p-[5%] rounded-[40px] shadow-2xl shadow-black/10 transition-transform hover:scale-105 duration-300 relative group max-w-[80%] aspect-square flex items-center justify-center overflow-hidden"
            >
              <img src={qrCodeDataURL} alt="QR Code Canvas" className="w-[180px] h-[180px] sm:w-[250px] sm:h-[250px] md:w-[350px] md:h-[350px] lg:w-[450px] lg:h-[450px] object-contain mix-blend-multiply" />
            </motion.div>
          ) : (
            <motion.div
              key="no-data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-muted-foreground/60 p-8 rounded-[40px] border-2 border-dashed border-border/50 bg-background/50 backdrop-blur w-[200px] h-[200px] md:w-[300px] md:h-[300px] lg:w-[400px] lg:h-[400px]"
            >
              <QrCode className="w-16 h-16 md:w-24 md:h-24 mb-4 stroke-1 opacity-50" />
              <p className="text-xs md:text-sm font-medium tracking-tight">Configure data</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-background/80 backdrop-blur-md border-t border-border flex items-center px-6">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {isGenerating ? 'Rendering Engine...' : 'Canvas Active & Tracking'}
          </div>
        </div>

      </div>

      <style>{`
        /* Smooth Scrollbar for the left panel */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default QRGenerator;