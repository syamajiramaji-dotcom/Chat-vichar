import type { NavSection } from "./NavSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home, Users, UsersRound, Bookmark, Settings, Info, Shield,
  FileText, BookOpen, HelpCircle, Mail, MessageSquare,
  Bell, Lock, Palette, Globe, ChevronRight, Share2, Copy, Check,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

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

function SettingsRow({ icon: Icon, label, desc, accent = false, onClick }: {
  icon: React.ElementType; label: string; desc?: string; accent?: boolean; onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="settings-row w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-2xl text-left group transition-all active:scale-[.99]"
      style={{ background: "var(--t-settings-card-bg)", border: "1px solid var(--t-settings-card-border)" }}>
      <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
        style={{ background: accent ? "var(--t-gradient-primary)" : "var(--t-empty-icon-bg)" }}>
        <Icon className="w-[18px] h-[18px]" style={{ color: accent ? "white" : "var(--t-icon-color)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground">{label}</p>
        {desc && <p className="text-[12px] text-muted-foreground mt-1 truncate">{desc}</p>}
      </div>
      <ChevronRight className="w-[18px] h-[18px] text-muted-foreground/45 shrink-0 transition-transform group-hover:translate-x-0.5" />
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
  const { toggleTheme } = useTheme();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteCopyError, setInviteCopyError] = useState(false);
  const inviteMessage = "मैं Chat-Vichar इस्तेमाल कर रहा हूँ। आप भी जुड़ें और अपने दोस्तों के साथ private और secure chat करें।";
  const inviteUrl = typeof window !== "undefined" ? window.location.href : "";
  const fullInvite = `${inviteMessage}\n${inviteUrl}`;

  useEffect(() => {
    if (!inviteOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInviteOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [inviteOpen]);

  const handleInvite = async () => {
    setInviteCopied(false);
    setInviteCopyError(false);

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Chat-Vichar",
          text: inviteMessage,
          url: inviteUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    setInviteOpen(true);
  };

  const handleCopyInvite = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullInvite);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = fullInvite;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("Clipboard copy was not available");
      }
      setInviteCopied(true);
      setInviteCopyError(false);
    } catch {
      setInviteCopied(false);
      setInviteCopyError(true);
    }
  };

  switch (section) {
    case "home":
      return (
        <>
          <ScrollArea className="h-full">
            <div className="home-page relative max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: "var(--t-home-orb-1)" }} />
              <div className="absolute top-72 -left-32 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: "var(--t-home-orb-2)" }} />

              <div className="relative text-center">
                <div className="relative inline-flex mb-5">
                  <div className="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-[27px] flex items-center justify-center btn-glow mx-auto"
                    style={{ background: "var(--t-gradient-primary)" }}>
                    <MessageSquare className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
                  </div>
                  <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full border-4"
                    style={{ background: "#22c55e", borderColor: "hsl(var(--background))" }} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[.22em] mb-3"
                  style={{ color: "var(--t-icon-color)" }}>
                  Simple. Private. Powerful.
                </p>
                <h1 className="text-[30px] sm:text-4xl font-bold tracking-tight gradient-text mb-3">Chat-vichar</h1>
                <p className="text-base sm:text-lg font-medium text-foreground/85 mb-3">
                  Private, secure and meaningful conversations.
                </p>
                <p className="text-sm leading-6 text-muted-foreground max-w-xl mx-auto">
                  Stay connected with friends and family through private chats, real-time conversations and a simple, secure messaging experience.
                </p>
              </div>

              <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 mt-9">
                {[
                  { icon: MessageSquare, label: "Private Chats", desc: "Secure one-to-one conversations with complete privacy." },
                  { icon: Users, label: "Contacts", desc: "Find and connect with people instantly." },
                  { icon: Bookmark, label: "Saved Messages", desc: "Keep important messages, links and memories safe." },
                  { icon: Bell, label: "Notifications", desc: "Receive instant alerts and never miss an important message." },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="home-feature-card group rounded-[22px] p-4 sm:p-5"
                    style={{ background: "var(--t-home-card-bg)", border: "1px solid var(--t-home-card-border)" }}>
                    <div className="w-10 h-10 rounded-[14px] flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                      style={{ background: "var(--t-empty-icon-bg)", border: "1px solid var(--t-empty-icon-border)" }}>
                      <Icon className="w-[18px] h-[18px]" style={{ color: "var(--t-icon-color)" }} />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1.5">{label}</p>
                    <p className="text-xs leading-5 text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              <button type="button" onClick={handleInvite}
                className="home-invite-card relative w-full mt-5 rounded-[22px] p-4 sm:p-5 flex items-center gap-3 text-left group active:scale-[.99]"
                style={{ border: "1px solid var(--t-home-invite-border)" }}>
                <div className="w-11 h-11 rounded-[15px] flex items-center justify-center shrink-0"
                  style={{ background: "var(--t-gradient-primary)", boxShadow: "0 8px 20px var(--t-primary-glow)" }}>
                  <UsersRound className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold text-foreground">अपने दोस्तों को Chat-Vichar पर आमंत्रित करें</h2>
                  <p className="text-xs leading-5 text-muted-foreground mt-1">
                    अपने दोस्तों और परिवार के साथ जुड़ें और सुरक्षित बातचीत शुरू करें।
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold"
                    style={{ color: "var(--t-icon-color)" }}>
                    <span aria-hidden="true">👥</span>
                    दोस्तों को आमंत्रित करें
                    <Share2 className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground/55 transition-transform group-hover:translate-x-0.5" />
              </button>

              <div className="relative mt-5 rounded-[22px] p-4 sm:p-5 flex items-center gap-3"
                style={{ background: "var(--t-home-note-bg)", border: "1px solid var(--t-home-card-border)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--t-gradient-primary)" }}>
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Your conversations stay personal, secure and focused on the people who matter.
                </p>
              </div>
            </div>
          </ScrollArea>

          {inviteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog" aria-modal="true" aria-labelledby="invite-dialog-title">
              <button type="button" aria-label="Close invite dialog"
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                onClick={() => setInviteOpen(false)} />
              <div className="relative w-full max-w-md rounded-[24px] p-5 sm:p-6 shadow-2xl"
                style={{ background: "var(--t-settings-card-bg)", border: "1px solid var(--t-settings-card-border)" }}>
                <button type="button" aria-label="Close invite dialog"
                  onClick={() => setInviteOpen(false)}
                  className="absolute right-4 top-4 w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                  ×
                </button>
                <div className="pr-8">
                  <h2 id="invite-dialog-title" className="text-lg font-semibold gradient-text">
                    दोस्तों को Chat-Vichar पर आमंत्रित करें
                  </h2>
                  <p className="text-sm text-muted-foreground pt-2 leading-5">
                    नीचे दिया गया invite message copy करके अपने दोस्तों के साथ share करें।
                  </p>
                </div>
                <div className="rounded-2xl p-3.5 mt-5 space-y-3"
                  style={{ background: "var(--t-input-bg)", border: "1px solid var(--t-input-border)" }}>
                  <p className="text-sm leading-6 text-foreground/85">{inviteMessage}</p>
                  <p className="text-xs leading-5 break-all text-muted-foreground">{inviteUrl}</p>
                </div>
                <button type="button" onClick={handleCopyInvite}
                  className="w-full min-h-12 mt-5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white btn-glow active:scale-[.98] transition-transform"
                  style={{ background: "var(--t-gradient-primary)" }}>
                  {inviteCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {inviteCopied ? "Copied" : "Copy Invite"}
                </button>
                {inviteCopyError && (
                  <p className="text-xs text-center text-destructive mt-3">
                    Copy unavailable. Please select the message and copy it manually.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
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
          <div className="settings-page max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="mb-7">
              <p className="text-[11px] font-bold uppercase tracking-[.2em] mb-2"
                style={{ color: "var(--t-icon-color)" }}>Preferences</p>
              <h1 className="text-[26px] font-bold tracking-tight text-foreground mb-1.5">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>

            <div className="space-y-2.5 mb-7">
              <p className="settings-section-label">Account</p>
              <SettingsRow icon={Users} label="Profile" desc="Update your name, photo, and bio" />
              <SettingsRow icon={Bell} label="Notifications" desc="Push, sound, and badge settings" />
              <SettingsRow icon={Lock} label="Privacy" desc="Control who can see your status" />
            </div>

            <div className="space-y-2.5 mb-7">
              <p className="settings-section-label">Appearance</p>
              <SettingsRow icon={Palette} label="Theme" desc="Toggle dark and light mode" accent onClick={toggleTheme} />
              <SettingsRow icon={Globe} label="Language" desc="English (default)" />
            </div>

            <div className="space-y-2.5">
              <p className="settings-section-label">Support</p>
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
