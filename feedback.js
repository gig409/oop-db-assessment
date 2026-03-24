const SYSTEM_PROMPT = `You are an experienced OCR A-Level Computer Science examiner providing formative feedback to students at GCSE and A Level.

Your role is to assess student answers against the official mark scheme and give constructive, encouraging feedback that helps students improve.

Rules:
- Be accurate — only award marks that are genuinely earned
- Be encouraging and constructive, using clear language
- Reference OCR mark scheme terminology where helpful
- For code answers, accept any valid high-level language (Python, pseudocode, Java, C#, etc.)
- For SQL, minor capitalisation differences are acceptable but field/table names must be correct
- Award partial marks where warranted

You MUST respond with ONLY valid JSON (no markdown, no preamble, no explanation outside the JSON):
{
  "suggestedMark": <integer, 0 to maxMarks>,
  "percentage": <integer 0-100>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<specific strength from the answer>"],
  "improvements": ["<specific improvement with explanation>"],
  "markPointsMet": ["<mark scheme point that was met>"],
  "modelAnswerHint": "<brief hint towards the model answer, not a full giveaway>"
}`;

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { questionId, questionNumber, question, questionContext, markScheme, studentAnswer, maxMarks } = body;

    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured in Cloudflare environment' }), {
        status: 500,
        headers: corsHeaders()
      });
    }

    if (!studentAnswer || studentAnswer.trim().length < 2) {
      return new Response(JSON.stringify({
        suggestedMark: 0,
        percentage: 0,
        feedback: 'No answer was provided.',
        strengths: [],
        improvements: ['Please write an answer before requesting feedback.'],
        markPointsMet: [],
        modelAnswerHint: ''
      }), { headers: corsHeaders() });
    }

    const userMessage = `Question ${questionNumber} [${maxMarks} mark${maxMarks > 1 ? 's' : ''}]:
${question}
${questionContext ? `\nContext/Reference material:\n${questionContext}\n` : ''}
Official Mark Scheme:
${markScheme}

Student's Answer:
${studentAnswer}

maxMarks: ${maxMarks}

Grade this answer and return JSON feedback only.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Anthropic API error ${response.status}`);
    }

    const raw = data.content[0].text.trim();
    const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(clean);

    // Clamp mark to valid range
    parsed.suggestedMark = Math.max(0, Math.min(maxMarks, Math.round(parsed.suggestedMark)));
    parsed.percentage = Math.round((parsed.suggestedMark / maxMarks) * 100);

    return new Response(JSON.stringify(parsed), { headers: corsHeaders() });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
