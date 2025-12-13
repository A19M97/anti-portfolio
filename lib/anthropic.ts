import Anthropic from "@anthropic-ai/sdk";
import {
  llmAnalysisOutputSchema,
  type LLMAnalysisOutput,
  type ClaudeModel,
  CLAUDE_MODELS
} from "./validations/profile-analysis";
import { loggers } from "./logger";

const logger = loggers.anthropic;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

logger.info("Anthropic client initialized", {
  hasApiKey: !!process.env.ANTHROPIC_API_KEY,
});

export interface AnalyzeProfileParams {
  desiredRole: string;
  model?: ClaudeModel;
}

export interface AnalyzeProfileResult {
  analysis: LLMAnalysisOutput;
  prompt: string;
  model: string;
  rawAnalysis: any; // Raw parsed JSON from Claude (before validation)
  claudeResponse: string; // Raw text response from Claude API
}

/**
 * Analyzes profile data using Claude and returns structured JSON output
 */
export async function analyzeProfileWithClaude(
  params: AnalyzeProfileParams
): Promise<AnalyzeProfileResult> {
  const { desiredRole, model = CLAUDE_MODELS.HAIKU } = params;

  const logComplete = logger.startOperation("analyzeProfileWithClaude", {
    hasDesiredRole: !!desiredRole,
    desiredRoleLength: desiredRole?.length || 0,
    model,
  });

  logger.info("Starting profile analysis for desired role", {
    desiredRole,
    model,
  });

  const prompt = `Sei un esperto analista di carriera che deve creare un profilo professionale realistico e completo per un candidato che aspira al ruolo di "${desiredRole}".

IMPORTANTE: Genera un profilo professionale FITTIZIO ma REALISTICO e COERENTE per una persona che vuole ottenere il ruolo di "${desiredRole}".

Il profilo deve includere:
- Competenze tecniche appropriate per il ruolo
- Esperienza lavorativa plausibile che conduca a questo ruolo
- Educazione pertinente
- Progetti personali o open source rilevanti
- Settori industriali appropriati

Considera il livello di seniority implicato dal ruolo richiesto:
- Se il ruolo è "Junior" o "Entry-level": crea un profilo con 0-2 anni di esperienza
- Se il ruolo è "Mid-level" o senza specificazione: crea un profilo con 2-5 anni di esperienza
- Se il ruolo è "Senior": crea un profilo con 5-8 anni di esperienza
- Se il ruolo è "Lead" o "Principal": crea un profilo con 8+ anni di esperienza

Genera un profilo che sia:
1. Realistico - le date, le aziende e le tecnologie devono essere coerenti con la timeline professionale
2. Specifico - includi dettagli concreti su tecnologie, metodologie e risultati ottenuti
3. Appropriato - le competenze e l'esperienza devono essere allineate al ruolo desiderato
4. Credibile - il percorso di carriera deve avere senso logicamente

IMPORTANTE: Ritorna SOLO un JSON valido nel formato specificato, senza testo aggiuntivo o spiegazioni.

Formato JSON richiesto:
{
  "role": "Il ruolo esatto richiesto dall'utente: ${desiredRole}",
  "seniority": "Il livello di seniority appropriato per questo ruolo (Junior, Mid-level, Senior, Lead, Principal, ecc.)",
  "sectors": ["Array di 2-4 settori industriali rilevanti per questo ruolo"],
  "skills": [
    {
      "name": "Nome della competenza o tecnologia",
      "category": "Categoria (es. Frontend, Backend, DevOps, Design, Project Management, ecc.)",
      "proficiency": "Livello appropriato per la seniority (Beginner, Intermediate, Advanced, Expert)"
    }
    // Includi 8-15 competenze rilevanti per il ruolo
  ],
  "workExperiences": [
    {
      "company": "Nome di un'azienda credibile (può essere fittizia ma realistica)",
      "position": "Titolo di lavoro coerente con il percorso di carriera",
      "startDate": "Data di inizio (formato: YYYY-MM)",
      "endDate": "Data di fine o 'Present' per il ruolo attuale",
      "description": "Descrizione dettagliata del ruolo, responsabilità e risultati ottenuti (2-4 frasi)",
      "technologies": ["Array di tecnologie utilizzate in questo ruolo"]
    }
    // Includi 2-5 esperienze lavorative a seconda della seniority
  ],
  "education": [
    {
      "institution": "Nome università o scuola",
      "degree": "Tipo di laurea appropriato per il ruolo (es. Bachelor's, Master's, Bootcamp, ecc.)",
      "field": "Campo di studi pertinente al ruolo",
      "startDate": "Data inizio (YYYY)",
      "endDate": "Data fine (YYYY)",
      "description": "Dettagli aggiuntivi, tesi, progetti accademici rilevanti"
    }
    // Includi 1-2 percorsi educativi
  ],
  "personalProjects": [
    {
      "name": "Nome del progetto personale o open source",
      "description": "Descrizione del progetto e del suo scopo (2-3 frasi)",
      "technologies": ["Tecnologie utilizzate nel progetto"],
      "url": "URL fittizio ma realistico (es. https://github.com/username/project-name)",
      "repository": "URL repository fittizio ma realistico"
    }
    // Includi 1-3 progetti personali rilevanti
  ],
  "summary": "Un riassunto professionale conciso (2-3 frasi) che evidenzia i punti di forza chiave, l'esperienza rilevante e gli obiettivi di carriera in linea con il ruolo desiderato di ${desiredRole}",
  "additionalData": {
    "languages": ["Italiano (Native)", "Inglese (Fluent/Advanced/Intermediate)"],
    "certifications": ["Eventuali certificazioni rilevanti per il ruolo"],
    "interests": ["Interessi professionali correlati al ruolo"]
  }
}

RICORDA:
- Ritorna SOLO JSON valido, nessun testo aggiuntivo
- Il profilo deve essere coerente internamente (le date devono avere senso, le tecnologie devono essere appropriate per il periodo)
- Le competenze devono essere bilanciate e appropriate per la seniority
- L'esperienza lavorativa deve mostrare una progressione di carriera logica`;

  logger.info("Sending request to Claude API", {
    model,
    maxTokens: 4096,
    promptLength: prompt.length,
  });

  const apiCallStart = Date.now();
  const message = await anthropic.messages.create({
    model: model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  const apiCallDuration = Date.now() - apiCallStart;

  logger.info("Received response from Claude API", {
    durationMs: apiCallDuration,
    stopReason: message.stop_reason,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    totalTokens: message.usage.input_tokens + message.usage.output_tokens,
  });

  // Extract JSON from Claude's response
  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  logger.debug("Extracting JSON from Claude response", {
    responseLength: responseText.length,
    responsePreview: responseText.substring(0, 200),
  });

  // Try to parse JSON from the response
  let parsedData: LLMAnalysisOutput;
  try {
    // Sometimes Claude wraps JSON in markdown code blocks
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                      responseText.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : responseText;

    logger.debug("Parsing JSON string", {
      hadCodeBlock: !!jsonMatch,
      jsonLength: jsonString.length,
    });

    parsedData = JSON.parse(jsonString.trim());

    logger.debug("JSON parsed successfully", {
      keys: Object.keys(parsedData),
    });
  } catch (error) {
    logger.error("Failed to parse Claude response as JSON", error, {
      responseText: responseText.substring(0, 500),
      responseLength: responseText.length,
    });
    throw new Error("Failed to parse LLM response as valid JSON");
  }

  // Validate the parsed data against our schema
  logger.debug("Validating parsed data against schema");
  try {
    const validatedData = llmAnalysisOutputSchema.parse(parsedData);

    logger.info("Profile analysis completed successfully", {
      hasRole: !!validatedData.role,
      hasSeniority: !!validatedData.seniority,
      sectorsCount: validatedData.sectors?.length || 0,
      skillsCount: validatedData.skills?.length || 0,
      workExperiencesCount: validatedData.workExperiences?.length || 0,
      educationCount: validatedData.education?.length || 0,
      projectsCount: validatedData.personalProjects?.length || 0,
    });

    logger.info("Returning complete analysis data including raw JSON", {
      rawAnalysisSize: JSON.stringify(parsedData).length,
      claudeResponseSize: responseText.length,
    });

    logComplete();

    return {
      analysis: validatedData,
      prompt,
      model,
      rawAnalysis: parsedData, // Complete parsed JSON before validation
      claudeResponse: responseText, // Raw text response from Claude
    };
  } catch (error) {
    logger.error("Schema validation failed", error, {
      parsedDataKeys: Object.keys(parsedData),
    });
    throw error;
  }
}
