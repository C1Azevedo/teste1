import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "800"],
  subsets: ["latin"],
});

const BG = "#FAF9F5";
const INK = "#1F1E1D";
const ACCENT = "#D97757";
const MUTED = "#6B6860";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

// Fade the whole scene in and out.
const SceneFade: React.FC<{ children: React.ReactNode; duration: number }> = ({
  children,
  duration,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 15, duration - 15, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundColor: BG,
        fontFamily,
        color: INK,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease } as const;
  return (
    <div
      style={{
        opacity: interpolate(frame, [delay, delay + 0.7 * fps], [0, 1], t),
        translate: interpolate(
          frame,
          [delay, delay + 0.7 * fps],
          ["0px 40px", "0px 0px"],
          t,
        ),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2 }}>{children}</div>
);

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 40, color: MUTED, fontWeight: 400, lineHeight: 1.4 }}>
    {children}
  </div>
);

const Intro: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const spin = interpolate(frame, [0, duration], [0, 90]);
  return (
    <SceneFade duration={duration}>
      <div
        style={{
          fontSize: 200,
          color: ACCENT,
          rotate: `${spin}deg`,
          lineHeight: 1,
          marginBottom: 20,
        }}
      >
        ✺
      </div>
      <Reveal delay={10}>
        <div style={{ fontSize: 180, fontWeight: 800, letterSpacing: -6 }}>Claude</div>
      </Reveal>
      <Reveal delay={30}>
        <Sub>O assistente de IA criado pela Anthropic</Sub>
      </Reveal>
    </SceneFade>
  );
};

const WhatIs: React.FC<{ duration: number }> = ({ duration }) => (
  <SceneFade duration={duration}>
    <div style={{ width: 1500 }}>
      <Reveal>
        <Title>
          O que é o <span style={{ color: ACCENT }}>Claude</span>?
        </Title>
      </Reveal>
      <Reveal delay={25} style={{ marginTop: 40 }}>
        <Sub>
          Um modelo de linguagem que conversa em linguagem natural, entende
          contexto e ajuda você a pensar, escrever e resolver problemas.
        </Sub>
      </Reveal>
      <Reveal delay={60} style={{ marginTop: 40 }}>
        <Sub>
          Foi projetado para ser <b style={{ color: INK }}>útil</b>,{" "}
          <b style={{ color: INK }}>honesto</b> e{" "}
          <b style={{ color: INK }}>seguro</b>.
        </Sub>
      </Reveal>
    </div>
  </SceneFade>
);

const Card: React.FC<{ icon: string; title: string; text: string; delay: number }> = ({
  icon,
  title,
  text,
  delay,
}) => (
  <Reveal
    delay={delay}
    style={{
      width: 400,
      padding: 40,
      borderRadius: 28,
      backgroundColor: "#fff",
      border: "2px solid #E8E6DC",
    }}
  >
    <div style={{ fontSize: 72 }}>{icon}</div>
    <div style={{ fontSize: 44, fontWeight: 600, marginTop: 16 }}>{title}</div>
    <div style={{ fontSize: 30, color: MUTED, marginTop: 12, lineHeight: 1.4 }}>
      {text}
    </div>
  </Reveal>
);

const Abilities: React.FC<{ duration: number }> = ({ duration }) => (
  <SceneFade duration={duration}>
    <Reveal>
      <Title>O que ele faz</Title>
    </Reveal>
    <div style={{ display: "flex", gap: 40, marginTop: 70 }}>
      <Card icon="✍️" title="Escrever" text="Textos, e-mails, resumos e traduções." delay={20} />
      <Card icon="💻" title="Programar" text="Escreve, explica e depura código." delay={35} />
      <Card icon="📊" title="Analisar" text="Dados, documentos e imagens." delay={50} />
      <Card icon="💡" title="Raciocinar" text="Ideias, planos e decisões." delay={65} />
    </div>
  </SceneFade>
);

const Models: React.FC<{ duration: number }> = ({ duration }) => {
  const rows = [
    ["Haiku", "Rápido e leve, para tarefas do dia a dia"],
    ["Sonnet", "Equilíbrio entre velocidade e capacidade"],
    ["Opus", "Mais capaz, para trabalhos complexos"],
  ];
  return (
    <SceneFade duration={duration}>
      <div style={{ width: 1400 }}>
        <Reveal>
          <Title>Uma família de modelos</Title>
        </Reveal>
        <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 28 }}>
          {rows.map(([name, desc], i) => (
            <Reveal
              key={name}
              delay={25 + i * 20}
              style={{ display: "flex", alignItems: "baseline", gap: 40 }}
            >
              <div style={{ fontSize: 64, fontWeight: 800, color: ACCENT, width: 280 }}>
                {name}
              </div>
              <div style={{ fontSize: 38, color: MUTED }}>{desc}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </SceneFade>
  );
};

const Where: React.FC<{ duration: number }> = ({ duration }) => {
  const items = [
    ["claude.ai", "Chat no navegador e nos apps"],
    ["Claude Code", "Agente de programação no terminal e na web"],
    ["API", "Para criar seus próprios produtos com Claude"],
  ];
  return (
    <SceneFade duration={duration}>
      <div style={{ width: 1400 }}>
        <Reveal>
          <Title>Onde usar</Title>
        </Reveal>
        <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 28 }}>
          {items.map(([name, desc], i) => (
            <Reveal
              key={name}
              delay={25 + i * 20}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 40,
                padding: "24px 40px",
                borderRadius: 24,
                backgroundColor: "#fff",
                border: "2px solid #E8E6DC",
              }}
            >
              <div style={{ fontSize: 52, fontWeight: 800, width: 380 }}>{name}</div>
              <div style={{ fontSize: 34, color: MUTED }}>{desc}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </SceneFade>
  );
};

const Outro: React.FC<{ duration: number }> = ({ duration }) => (
  <SceneFade duration={duration}>
    <Reveal>
      <div style={{ fontSize: 120, color: ACCENT }}>✺</div>
    </Reveal>
    <Reveal delay={15}>
      <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -3 }}>
        Converse com o Claude
      </div>
    </Reveal>
    <Reveal delay={35}>
      <Sub>claude.ai</Sub>
    </Reveal>
  </SceneFade>
);

export const ClaudeExplainer: React.FC = () => {
  const { fps } = useVideoConfig();
  const scenes: [string, number, React.FC<{ duration: number }>][] = [
    ["Intro", 5 * fps, Intro],
    ["O que é", 9 * fps, WhatIs],
    ["O que faz", 8 * fps, Abilities],
    ["Modelos", 8 * fps, Models],
    ["Onde usar", 8 * fps, Where],
    ["Final", 4 * fps, Outro],
  ];
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {scenes.map(([name, duration, Scene]) => {
        const start = from;
        from += duration;
        return (
          <Sequence key={name} name={name} from={start} durationInFrames={duration}>
            <Scene duration={duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
