import { C, card, serif, sans } from "../components/noraTokens";

const Section = ({ title, children }) => (
  <div style={{ ...card, padding: "20px 22px", marginBottom: 14 }}>
    <h2 style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: C.green, margin: "0 0 10px" }}>{title}</h2>
    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.75 }}>{children}</div>
  </div>
);

const P = ({ children }) => <p style={{ margin: "0 0 10px" }}>{children}</p>;

export default function Privacy() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: sans, padding: "40px 20px 80px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <h1 style={{ fontFamily: serif, fontSize: 28, color: C.green, fontWeight: 700, margin: "0 0 6px" }}>Privacy</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 28px", lineHeight: 1.7 }}>
          What we collect, why, where it lives, and how to delete it — in plain language, not legal wording.
        </p>

        <Section title="What we collect, and why">
          <P><strong>Account:</strong> your email, to sign you in.</P>
          <P><strong>Profile:</strong> name, age, sex, height/weight, goals, activity level, dietary preferences, language — so we can calculate personalised targets and tailor recommendations.</P>
          <P><strong>Meals (Eat):</strong> whatever you log — a photo, a barcode, or a search — plus the estimated calories and macros, so we can track your daily nutrition and Nora can comment on it.</P>
          <P><strong>Ritual:</strong> the challenges you start and the days you check in, so we can keep your progress and streak.</P>
          <P><strong>Settings:</strong> your preferred units (cm/ft, kg/lbs) and notification preference.</P>
          <P>
            <strong>Hormonal rhythms and life stage (optional — a special category of data under GDPR):</strong> if you choose to turn on biological personalisation in Me → Preferences, you can tell Nora about your hormonal rhythms and current life stage. This context is used only to adapt nutrition and ritual suggestions to what your body is going through. It's off by default, turned on only by your explicit choice, and you can turn it off at any time — adaptations stop immediately, and anything you entered stays under your control (edit it in your profile, or remove it entirely by deleting your account).
          </P>
        </Section>

        <Section title="Where it's stored">
          <P>Everything is stored in Supabase, with servers in the European Union (Ireland). Your password is never stored in plain text — sign-in is handled entirely by Supabase Auth.</P>
        </Section>

        <Section title="Who has access">
          <P>Only you. Every table in the database has Row Level Security enabled, meaning each row is visible and editable exclusively by the account that created it.</P>
          <P>The developer can access the database for technical maintenance, but does not read individual accounts as a matter of routine.</P>
          <P>We don't sell or share your data with advertisers.</P>
          <P>Nora's comments and replies are generated through Anthropic's API (Claude): only the data strictly needed for a given reply (e.g. today's meals, your question) is sent to Anthropic to generate it; under their API terms, this data is not used to train their models.</P>
        </Section>

        <Section title="How to delete it">
          <P>From Me → Delete account: this is permanent and immediately removes your account and everything tied to it (profile, meals, challenges, settings). It cannot be undone.</P>
          <P>You can also simply stop using the app — your data stays stored until you explicitly request deletion.</P>
        </Section>

        <Section title="Contact">
          <P>Contact details will be published here before public launch.</P>
        </Section>
      </div>
    </div>
  );
}
