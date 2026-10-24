// The three principles (how-we-work.astro and, TEMPORARY (NWARE-82), its layout directions under
// components/how-we-work/). `detail` is a list of runs; every second run (odd index) is set in italics.

export interface Principle {
  title: string;
  subtitle: string;
  detail: readonly string[];
}

export const PRINCIPLES: readonly Principle[] = [
  {
    title: 'Product mindset',
    subtitle: 'We build for our users. We ship what moves the needle.',
    detail: [
      "A feature only matters if it makes someone's day easier, so that's what we measure our work by. The best products disappear into someone's routine. They feel obvious, they just work — that kind of ",
      'simple',
      ' is never an accident.',
    ],
  },
  {
    title: 'Always in motion',
    subtitle: 'Agents work around the clock. Every morning starts with progress.',
    detail: [
      "Most projects don't fail, they ",
      'stall',
      ', so our agents keep the work moving around the clock. We build the pipelines, workflows and guardrails that keep them in check. Our harness delivers continuously and ensures every change is proven before it gets out of our lab.',
    ],
  },
  {
    title: 'Zero friction',
    subtitle: 'Every change goes from idea to production in one continuous, elegant flow.',
    detail: [
      'Most delays live in the ',
      'gaps',
      " between people. We closed them with knowledge and tools: every decision, rule and piece of context sits within our agents' reach — they never wait on an answer. The same trail lets us observe, step in and steer, with the right information a glance away.",
    ],
  },
];

/** A principle's position as the layouts print it: 01, 02, 03. */
export const principleNumber = (index: number): string => String(index + 1).padStart(2, '0');
