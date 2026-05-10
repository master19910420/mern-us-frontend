/**
 * Partnership (partner link) question set.
 * 15 single-choice (MCQ) questions with 4 options each.
 */
export const QUESTIONNAIRES = [
  {
    id: 'partnership',
    title: 'Questions',
    description: 'Assess your approach to problem solving, collaboration, priorities, and communication.',
    questions: [
      {
        id: '1',
        text: 'When facing a complex problem, I prefer to:',
        answers: [
          { id: 'a', text: 'Break it down into smaller parts and analyze each one' },
          { id: 'b', text: 'Ask others for their view first' },
          { id: 'c', text: 'Trust my gut and decide quickly' },
          { id: 'd', text: 'Research similar past situations' },
        ],
      },
      {
        id: '2',
        text: 'How do you ensure you deliver quality work?',
        answers: [
          { id: 'a', text: 'I set clear standards and check my work against them' },
          { id: 'b', text: 'I rely on feedback from others' },
          { id: 'c', text: 'I focus on finishing on time' },
          { id: 'd', text: 'I prioritize what matters most to the goal' },
        ],
      },
      {
        id: '3',
        text: 'When asked to suggest new ideas, I typically:',
        answers: [
          { id: 'a', text: 'Brainstorm several options and build on the best one' },
          { id: 'b', text: 'Look at what has worked before' },
          { id: 'c', text: 'Suggest one strong idea I believe in' },
          { id: 'd', text: "Combine others' ideas in a new way" },
        ],
      },
      {
        id: '4',
        text: 'When you encounter something you don\'t understand, you:',
        answers: [
          { id: 'a', text: 'Look it up or ask someone to learn more' },
          { id: 'b', text: 'Note it and move on for now' },
          { id: 'c', text: 'Try to figure it out by experimenting' },
          { id: 'd', text: 'Discuss it with the team' },
        ],
      },
      {
        id: '5',
        text: 'How do you approach deadlines and priorities?',
        answers: [
          { id: 'a', text: 'I plan my time and stick to the plan' },
          { id: 'b', text: 'I adjust as new tasks come in' },
          { id: 'c', text: 'I focus on the most urgent first' },
          { id: 'd', text: 'I balance flexibility with clear milestones' },
        ],
      },
      {
        id: '6',
        text: 'When a teammate is struggling, I:',
        answers: [
          { id: 'a', text: 'Listen and try to understand their situation' },
          { id: 'b', text: 'Offer practical help or resources' },
          { id: 'c', text: 'Give them space to figure it out' },
          { id: 'd', text: 'Check in and suggest we work through it together' },
        ],
      },
      {
        id: '7',
        text: 'I am most motivated when:',
        answers: [
          { id: 'a', text: 'There are new challenges or chances to learn' },
          { id: 'b', text: 'I can see the clear impact of my work' },
          { id: 'c', text: 'I work with a strong team' },
          { id: 'd', text: 'I have clear goals and autonomy' },
        ],
      },
      {
        id: '8',
        text: 'When receiving feedback, I usually:',
        answers: [
          { id: 'a', text: 'Reflect on it and look for ways to improve' },
          { id: 'b', text: 'Ask for examples to understand better' },
          { id: 'c', text: 'Take time to process before responding' },
          { id: 'd', text: 'Apply it quickly to my next task' },
        ],
      },
      {
        id: '9',
        text: 'In a disagreement with a colleague, I tend to:',
        answers: [
          { id: 'a', text: 'Listen first and then share my perspective' },
          { id: 'b', text: 'Look for common ground and compromise' },
          { id: 'c', text: 'Focus on the outcome we both want' },
          { id: 'd', text: 'Suggest we step back and revisit later' },
        ],
      },
      {
        id: '10',
        text: 'When my workload increases suddenly, I:',
        answers: [
          { id: 'a', text: 'Prioritize and communicate what I can deliver' },
          { id: 'b', text: 'Work longer hours to meet everything' },
          { id: 'c', text: 'Ask for help or delegation' },
          { id: 'd', text: 'Reassess deadlines with stakeholders' },
        ],
      },
      {
        id: '11',
        text: 'I learn best when:',
        answers: [
          { id: 'a', text: 'I can try things hands-on' },
          { id: 'b', text: 'I have clear instructions or documentation' },
          { id: 'c', text: 'I discuss with others' },
          { id: 'd', text: 'I see examples or demos first' },
        ],
      },
      {
        id: '12',
        text: 'When a project fails or is delayed, I:',
        answers: [
          { id: 'a', text: 'Focus on what we can learn from it' },
          { id: 'b', text: 'Look for ways to recover or adjust' },
          { id: 'c', text: 'Communicate clearly with those affected' },
          { id: 'd', text: 'Review what went wrong and document it' },
        ],
      },
      {
        id: '13',
        text: 'How do you prefer to work with others?',
        answers: [
          { id: 'a', text: 'Collaborate closely and share ideas often' },
          { id: 'b', text: 'Work independently and sync at milestones' },
          { id: 'c', text: 'A mix of both, depending on the task' },
          { id: 'd', text: 'Lead when needed and support when not' },
        ],
      },
      {
        id: '14',
        text: 'When something is unclear or ambiguous, I:',
        answers: [
          { id: 'a', text: 'Ask questions until I understand' },
          { id: 'b', text: 'Make reasonable assumptions and document them' },
          { id: 'c', text: 'Look for similar past cases' },
          { id: 'd', text: 'Propose an approach and get feedback' },
        ],
      },
      {
        id: '15',
        text: 'What matters most to you in a role?',
        answers: [
          { id: 'a', text: 'Growth and learning' },
          { id: 'b', text: 'Impact and results' },
          { id: 'c', text: 'Team and culture' },
          { id: 'd', text: 'Stability and work-life balance' },
        ],
      },
    ],
  },
]

/**
 * Questionnaires for the Investor path – Institutional Markets & Trading Strategist at Anchorage Digital.
 * Role: identifying and executing strategic opportunities across global financial and digital asset markets,
 * supporting institutional trading, portfolio strategy, and market intelligence.
 */
export const INVESTOR_QUESTIONNAIRES = [
  {
    id: 'markets-trading',
    title: 'Markets & Trading Strategy',
    description: 'Assess your approach to researching global financial and digital asset markets, executing trading strategies, and using technical and quantitative tools.',
    questions: [
      {
        id: 1,
        text: 'When you identify an investment or trading opportunity across global financial or digital asset markets, how do you prioritize and act on it?',
        answers: [
          { id: 'a', text: 'Quantify the opportunity and risk; align with strategy and risk limits before execution.' },
          { id: 'b', text: 'Research market data and trends first, then propose a clear thesis and execution plan to the team.' },
          { id: 'c', text: 'Monitor real-time liquidity and price movements; size positions according to risk parameters.' },
          { id: 'd', text: 'Use technical indicators and quantitative tools to validate the opportunity before committing.' },
          { id: 'e', text: 'Balance speed of execution with thorough analysis; document rationale and review with risk and trading teams.' },
        ],
      },
      {
        id: 2,
        text: 'How do you use technical indicators, quantitative tools, and market analysis to guide trading decisions for digital assets and related instruments?',
        answers: [
          { id: 'a', text: 'Combine multiple signals with clear rules; backtest where possible and maintain discipline in live execution.' },
          { id: 'b', text: 'Stay current on market structure across exchanges and OTC markets; adapt tools to changing liquidity.' },
          { id: 'c', text: 'Work with research and product to improve models and data; integrate feedback into the decision process.' },
          { id: 'd', text: 'Document assumptions and limitations of each tool; avoid over-reliance on any single indicator.' },
          { id: 'e', text: 'Balance quantitative inputs with fundamental and macro context for risk-adjusted decisions.' },
        ],
      },
      {
        id: 3,
        text: 'You need to develop and execute a new trading strategy for digital assets. What is your first step?',
        answers: [
          { id: 'a', text: 'Define objectives, constraints, and success metrics; get alignment with trading and risk teams.' },
          { id: 'b', text: 'Analyze historical data and market structure; identify edge and capacity before scaling.' },
          { id: 'c', text: 'Pilot in a controlled environment; measure performance and risk, then iterate or scale.' },
          { id: 'd', text: 'Ensure integration with existing systems and compliance with risk and exposure limits.' },
          { id: 'e', text: 'Document the strategy and review process so it can be maintained and improved over time.' },
        ],
      },
      {
        id: 4,
        text: 'How do you track macroeconomic trends, regulations, and global events that may affect financial and digital asset markets?',
        answers: [
          { id: 'a', text: 'Maintain a structured process: key indicators, regulatory updates, and event calendars; share insights with the team.' },
          { id: 'b', text: 'Incorporate macro and regulatory views into position sizing and strategy adjustments.' },
          { id: 'c', text: 'Collaborate with research and compliance to interpret impact on trading and custody operations.' },
          { id: 'd', text: 'Document how events could affect liquidity, volatility, and risk; update exposure and limits as needed.' },
          { id: 'e', text: 'Balance short-term market moves with longer-term structural changes in regulation and adoption.' },
        ],
      },
    ],
  },
  {
    id: 'risk-analysis-collab',
    title: 'Risk, Analysis & Collaboration',
    description: 'Evaluate how you manage trading risk, prepare market reports, and work with trading, research, product, and risk teams.',
    questions: [
      {
        id: 1,
        text: 'How do you manage trading risk through position sizing, diversification, and exposure monitoring in fast-moving markets?',
        answers: [
          { id: 'a', text: 'Set clear limits per strategy and instrument; monitor in real time and escalate when approaching thresholds.' },
          { id: 'b', text: 'Diversify across assets and venues; avoid concentration that could create outsized drawdowns.' },
          { id: 'c', text: 'Work with risk management to define and implement controls; keep an audit trail of decisions.' },
          { id: 'd', text: 'Balance return objectives with risk capacity; adjust size and exposure when volatility or liquidity changes.' },
          { id: 'e', text: 'Communicate exposure and P&amp;L to stakeholders so expectations stay aligned with reality.' },
        ],
      },
      {
        id: 2,
        text: 'You need to prepare market reports, performance analysis, and investment insights for internal teams. How do you approach this?',
        answers: [
          { id: 'a', text: 'Focus on actionable insights: what happened, why it matters, and what we might do next.' },
          { id: 'b', text: 'Use data and charts to support narrative; keep reports concise and aligned with audience (trading, research, leadership).' },
          { id: 'c', text: 'Include risk and attribution so readers understand drivers of performance and exposure.' },
          { id: 'd', text: 'Share drafts with key stakeholders for feedback; iterate so the output supports decision-making.' },
          { id: 'e', text: 'Maintain consistency in format and timing so teams can rely on the information.' },
        ],
      },
      {
        id: 3,
        text: 'How do you work with trading, research, product, and risk teams to improve trading systems, strategies, and market analysis processes?',
        answers: [
          { id: 'a', text: 'Share pain points and ideas; co-own initiatives that improve execution, data, or risk tools.' },
          { id: 'b', text: 'Participate in roadmap and design discussions so trading and risk requirements are built in early.' },
          { id: 'c', text: 'Use volume, latency, and P&L data to prioritize what to fix or automate first.' },
          { id: 'd', text: 'Define clear handoffs and escalation paths so issues are resolved without blocking daily trading.' },
          { id: 'e', text: 'Balance BAU delivery with strategic improvements; avoid letting firefighting block longer-term work.' },
        ],
      }
    ],
  },
  {
    id: 'strategy-communication',
    title: 'Strategy, Communication & Operational Excellence',
    description: 'Explore how you contribute to capital markets capabilities, explain market insights, and improve processes on a digital asset platform.',
    questions: [
      {
        id: 1,
        text: 'How do you help strengthen institutional market participation and enhance the organization’s digital asset trading infrastructure?',
        answers: [
          { id: 'a', text: 'Identify gaps in data, execution, or risk tools; propose and support initiatives to close them.' },
          { id: 'b', text: 'Share market and client feedback with product and engineering to shape platform evolution.' },
          { id: 'c', text: 'Document best practices and playbooks so the team can scale institutional coverage.' },
          { id: 'd', text: 'Align with leadership on priorities; balance day-to-day trading with strategic projects.' },
          { id: 'e', text: 'Ensure trading and custody workflows meet institutional standards for reliability and compliance.' },
        ],
      },
      {
        id: 2,
        text: 'How do you explain market insights and trading decisions effectively to internal and external stakeholders?',
        answers: [
          { id: 'a', text: 'Lead with the key message and support it with data; tailor depth to the audience.' },
          { id: 'b', text: 'Acknowledge uncertainty and assumptions; clarify what is known vs. speculative.' },
          { id: 'c', text: 'Use clear language and avoid unnecessary jargon; invite questions to ensure understanding.' },
          { id: 'd', text: 'Connect insights to implications for strategy, risk, or client service.' },
          { id: 'e', text: 'Follow up in writing when needed so there is a record and shared understanding.' },
        ],
      },
      {
        id: 3,
        text: 'You identify an opportunity to improve trading systems or market analysis processes. What do you do first?',
        answers: [
          { id: 'a', text: 'Quantify the benefit and effort; socialize with trading, research, and product for buy-in.' },
          { id: 'b', text: 'Propose a small pilot or A/B test to validate the idea before full rollout.' },
          { id: 'c', text: 'Document the current state and target state; identify owners and a realistic timeline.' },
          { id: 'd', text: 'Ensure the change fits within risk and compliance guardrails.' },
          { id: 'e', text: 'Balance quick wins with longer-term roadmap so the team sees progress and stays aligned.' },
        ],
      },
      {
        id: 4,
        text: 'How do you balance fundamental financial analysis, macroeconomic research, and advanced trading strategies to support informed investment decisions?',
        answers: [
          { id: 'a', text: 'Integrate multiple inputs into a coherent view; stress-test against scenarios before committing capital.' },
          { id: 'b', text: 'Stay disciplined: when the thesis is intact and risk is controlled, act; when not, step back.' },
          { id: 'c', text: 'Work with research to deepen fundamental and macro work; use trading feedback to refine execution.' },
          { id: 'd', text: 'Optimize for risk-adjusted returns over time, not single trades.' },
          { id: 'e', text: 'Document and review decisions so the process improves and stays aligned with institutional standards.' },
        ],
      },
    ],
  },
]

/** Invite link length that indicates investor path (25 chars). Partner links are 22 chars. */
export const INVESTOR_INVITE_LINK_LENGTH = 25

/**
 * Returns the questionnaire set for the given invite link. Use investor questionnaires when link length is 25; otherwise partner.
 */
export function getQuestionnairesForInviteLink(inviteLink) {
  if (inviteLink && inviteLink.length === INVESTOR_INVITE_LINK_LENGTH) {
    return INVESTOR_QUESTIONNAIRES
  }
  return QUESTIONNAIRES
}

/** Total number of questions across all questionnaires. */
export const TOTAL_QUESTIONS_COUNT = QUESTIONNAIRES.reduce((sum, q) => sum + q.questions.length, 0)

/** Display: number of questionnaires (sections). */
export const QUESTIONNAIRE_COUNT = QUESTIONNAIRES.length

/** Display: total number of questions. */
export const QUESTION_COUNT = TOTAL_QUESTIONS_COUNT

/** Assessment duration in minutes (for instructions and timer). */
export const ASSESSMENT_DURATION_MINUTES = 11

/** @deprecated Use QUESTIONNAIRES and flatten if needed. */
export const QUESTIONS = QUESTIONNAIRES.flatMap((q) => q.questions)
