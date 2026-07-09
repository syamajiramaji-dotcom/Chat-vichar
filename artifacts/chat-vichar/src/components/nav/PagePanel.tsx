import type { NavSection } from "./NavSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home, Users, UsersRound, Bookmark, Settings, Info, Shield,
  FileText, BookOpen, HelpCircle, Mail, MessageSquare,
  Bell, Lock, Palette, Globe, ChevronRight,
} from "lucide-react";

interface PagePanelProps {
  section: NavSection;
}

function SectionBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
      style={{ background: color + "18", color }}>
      {label}
    </span>
  );
}

function SettingsRow({ icon: Icon, label, desc, accent = false }: {
  icon: React.ElementType; label: string; desc?: string; accent?: boolean;
}) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left group transition-all"
      style={{ border: "1px solid var(--t-divider)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accent ? "var(--t-gradient-primary)" : "var(--t-empty-icon-bg)" }}>
        <Icon className="w-4.5 h-4.5" style={{ color: accent ? "white" : "var(--t-icon-color)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
    </button>
  );
}

function EmptyPage({ icon: Icon, title, desc, badge }: {
  icon: React.ElementType; title: string; desc: string; badge?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background: "var(--t-empty-icon-bg)",
            border: "1px solid var(--t-empty-icon-border)",
            boxShadow: "var(--t-empty-icon-shadow)"
          }}>
          <Icon className="w-10 h-10" style={{ color: "var(--t-icon-color)" }} />
        </div>
        <div className="absolute inset-0 rounded-3xl blur-xl opacity-25"
          style={{ background: "var(--t-empty-orb)" }} />
      </div>
      {badge && <div className="mb-3"><SectionBadge label={badge} color="var(--t-icon-color)" /></div>}
      <h2 className="text-xl font-bold gradient-text mb-2">{title}</h2>
      <p className="text-muted-foreground/70 text-sm leading-relaxed max-w-sm">{desc}</p>
    </div>
  );
}

function InfoPage({ title, sections }: { title: string; sections: { heading: string; body: string }[] }) {
  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold gradient-text mb-6">{title}</h1>
        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.heading}>
              <h3 className="font-semibold text-foreground mb-2">{s.heading}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function PagePanel({ section }: PagePanelProps) {
  switch (section) {
    case "home":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center btn-glow mx-auto"
              style={{ background: "var(--t-gradient-primary)" }}>
              <MessageSquare className="w-12 h-12 text-white" />
            </div>
            <div className="absolute inset-0 rounded-3xl blur-2xl opacity-30"
              style={{ background: "var(--t-gradient-primary)" }} />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3">Chat-vichar</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-8">
            An intimate, private messaging space. Your conversations are yours alone — secure, personal, and always at hand.
          </p>
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {[
              { icon: MessageSquare, label: "Private chats", desc: "End-to-end conversations" },
              { icon: Users, label: "Contacts", desc: "Find people to chat with" },
              { icon: Bookmark, label: "Saved", desc: "Your important messages" },
              { icon: Bell, label: "Notifications", desc: "Web push support" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-start gap-1.5 p-3.5 rounded-2xl"
                style={{ background: "var(--t-user-chip-bg)", border: "1px solid var(--t-user-chip-border)" }}>
                <Icon className="w-5 h-5" style={{ color: "var(--t-icon-color)" }} />
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "people":
      return (
        <EmptyPage icon={Users} title="People" badge="Coming Soon"
          desc="Discover and connect with people on Chat-vichar. Browse profiles, follow contacts, and grow your network." />
      );

    case "groups":
      return (
        <EmptyPage icon={UsersRound} title="Groups" badge="Coming Soon"
          desc="Create or join group conversations. Share ideas, coordinate plans, and stay connected with multiple people at once." />
      );

    case "saved":
      return (
        <EmptyPage icon={Bookmark} title="Saved Messages" badge="Coming Soon"
          desc="Star and save important messages from any conversation. Find them instantly whenever you need them." />
      );

    case "settings":
      return (
        <ScrollArea className="h-full">
          <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">Account</p>
              <SettingsRow icon={Users} label="Profile" desc="Update your name, photo, and bio" />
              <SettingsRow icon={Bell} label="Notifications" desc="Push, sound, and badge settings" />
              <SettingsRow icon={Lock} label="Privacy" desc="Control who can see your status" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">Appearance</p>
              <SettingsRow icon={Palette} label="Theme" desc="Toggle dark and light mode" accent />
              <SettingsRow icon={Globe} label="Language" desc="English (default)" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">Support</p>
              <SettingsRow icon={HelpCircle} label="Help & Support" desc="FAQs and troubleshooting" />
              <SettingsRow icon={Info} label="About Chat-vichar" desc="Version 1.0" />
            </div>
          </div>
        </ScrollArea>
      );

    case "about":
      return (
        <InfoPage title="About Us" sections={[
          { heading: "What is Chat-vichar?", body: "Chat-vichar is a private, real-time messaging platform built for intimate and meaningful conversations. We believe in giving users a space that is personal, secure, and distraction-free." },
          { heading: "Our Mission", body: "We aim to provide a clean and private communication experience. No algorithms, no ads, no data harvesting — just you and the people you care about." },
          { heading: "Technology", body: "Chat-vichar is powered by Firebase Authentication, Socket.io for real-time messaging, and Cloudinary for secure media uploads. All user sessions are authenticated and data is stored securely." },
          { heading: "Open & Honest", body: "We are transparent about how the app works and committed to keeping your data private. Your messages belong to you." },
        ]} />
      );

    case "privacy":
      return (
        <InfoPage title="Privacy Policy" sections={[
          { heading: "Data We Collect", body: "We collect only what is necessary: your display name, email address, and profile photo (if provided via Google Sign-In). Message content is stored to enable real-time delivery." },
          { heading: "How We Use Your Data", body: "Your data is used solely to deliver the chat service. We do not sell, share, or expose your personal information to third parties for advertising or analytics purposes." },
          { heading: "Message Storage", body: "Messages are stored in our secure database to support delivery, history, and notifications. You can delete your messages at any time." },
          { heading: "Cookies & Sessions", body: "We use session tokens to keep you logged in securely. No tracking cookies are used." },
          { heading: "Your Rights", body: "You may request deletion of your account and all associated data at any time by contacting us." },
        ]} />
      );

    case "terms":
      return (
        <InfoPage title="Terms & Conditions" sections={[
          { heading: "Acceptance of Terms", body: "By using Chat-vichar, you agree to these terms. If you do not agree, please do not use the service." },
          { heading: "User Conduct", body: "You agree not to use Chat-vichar for harassment, spam, illegal activity, or the distribution of harmful content. Violations may result in account suspension." },
          { heading: "Intellectual Property", body: "Content you send via Chat-vichar remains yours. You grant us a limited license to store and transmit it as part of the service." },
          { heading: "Limitation of Liability", body: "Chat-vichar is provided as-is. We are not liable for any indirect damages arising from your use of the service." },
          { heading: "Changes to Terms", body: "We may update these terms at any time. Continued use of the service constitutes acceptance of the updated terms." },
        ]} />
      );

    case "community":
      return (
        <InfoPage title="Community Guidelines" sections={[
          { heading: "Be Respectful", body: "Treat everyone with respect. Harassment, bullying, and hate speech of any kind are strictly prohibited." },
          { heading: "No Spam", body: "Do not send unsolicited messages, chain messages, or excessive promotional content." },
          { heading: "Protect Privacy", body: "Do not share other people's personal information without their consent. Respect the privacy of your conversation partners." },
          { heading: "No Harmful Content", body: "Do not share illegal, violent, or sexually explicit content. This includes links to harmful external websites." },
          { heading: "Reporting", body: "If you encounter behavior that violates these guidelines, please contact us immediately. We take all reports seriously." },
        ]} />
      );

    case "faq":
      return (
        <InfoPage title="FAQ" sections={[
          { heading: "How do I start a conversation?", body: "Select a contact from the Chats section in the sidebar. Click on any user to open a private chat window and start messaging instantly." },
          { heading: "Are my messages private?", body: "Yes. Chats are private between you and the other person. No one else can see your messages." },
          { heading: "Can I send photos and videos?", body: "Yes! Tap the image icon in the message input to attach photos or videos. Files are uploaded securely via Cloudinary." },
          { heading: "How do I send a voice message?", body: "Tap the microphone icon in the chat input to start recording. Tap the stop button to send." },
          { heading: "Can I delete messages?", body: 'Yes. Long-press or hover over any message and choose "Delete for Me" or "Delete for Everyone" (within 1 hour of sending).' },
          { heading: "How do I switch themes?", body: "Use the Theme toggle in the sidebar navigation to switch between Dark and Light mode. Your preference is saved automatically." },
        ]} />
      );

    case "contact":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
              style={{ background: "var(--t-empty-icon-bg)", border: "1px solid var(--t-empty-icon-border)", boxShadow: "var(--t-empty-icon-shadow)" }}>
              <Mail className="w-10 h-10" style={{ color: "var(--t-icon-color)" }} />
            </div>
          </div>
          <h2 className="text-xl font-bold gradient-text mb-2">Contact Us</h2>
          <p className="text-muted-foreground/70 text-sm leading-relaxed max-w-sm mb-8">
            We'd love to hear from you. Reach out with questions, feedback, or bug reports.
          </p>
          <div className="w-full max-w-sm space-y-3">
            {[
              { icon: Mail, label: "Email Support", desc: "support@chat-vichar.app" },
              { icon: Globe, label: "Website", desc: "chat-vichar.app" },
              { icon: HelpCircle, label: "Help Center", desc: "Check our FAQ for quick answers" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 p-3.5 rounded-2xl text-left"
                style={{ background: "var(--t-user-chip-bg)", border: "1px solid var(--t-user-chip-border)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--t-empty-icon-bg)" }}>
                  <Icon className="w-4 h-4" style={{ color: "var(--t-icon-color)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
