import "server-only";

export type TeacherVoiceovers = {
  introAudioUrl?: string;
  conclusionAudioUrl?: string;
  teacherVoiceId?: string;
  modelId?: string;
};

type TeacherVoiceoverInput = {
  intro: string;
  conclusion: string;
};

const DEFAULT_TTS_MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";
const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

function getTeacherVoiceConfig() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const teacherVoiceId = process.env.ELEVENLABS_TEACHER_VOICE_ID?.trim();
  const modelId =
    process.env.ELEVENLABS_TTS_MODEL_ID?.trim() || DEFAULT_TTS_MODEL_ID;

  return { apiKey, teacherVoiceId, modelId };
}

async function synthesizeLine(
  text: string,
  config: { apiKey: string; teacherVoiceId: string; modelId: string }
): Promise<string> {
  const url = new URL(
    `${ELEVENLABS_TTS_URL}/${encodeURIComponent(config.teacherVoiceId)}`
  );
  url.searchParams.set("output_format", OUTPUT_FORMAT);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": config.apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: config.modelId,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS failed with ${response.status}${body ? `: ${body}` : ""}`
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error("ElevenLabs returned an empty audio response.");
  }

  return `data:audio/mpeg;base64,${bytes.toString("base64")}`;
}

export async function generateTeacherVoiceovers({
  intro,
  conclusion,
}: TeacherVoiceoverInput): Promise<TeacherVoiceovers> {
  const { apiKey, teacherVoiceId, modelId } = getTeacherVoiceConfig();

  if (!apiKey || !teacherVoiceId) {
    console.warn(
      "Skipping ElevenLabs voiceovers because ELEVENLABS_API_KEY or ELEVENLABS_TEACHER_VOICE_ID is missing."
    );
    return {};
  }

  const config = { apiKey, teacherVoiceId, modelId };
  const [introResult, conclusionResult] = await Promise.allSettled([
    synthesizeLine(intro, config),
    synthesizeLine(conclusion, config),
  ]);

  const voiceovers: TeacherVoiceovers = {
    teacherVoiceId,
    modelId,
  };

  if (introResult.status === "fulfilled") {
    voiceovers.introAudioUrl = introResult.value;
  } else {
    console.warn("Failed to generate ElevenLabs intro voiceover.", introResult.reason);
  }

  if (conclusionResult.status === "fulfilled") {
    voiceovers.conclusionAudioUrl = conclusionResult.value;
  } else {
    console.warn(
      "Failed to generate ElevenLabs conclusion voiceover.",
      conclusionResult.reason
    );
  }

  return voiceovers;
}
