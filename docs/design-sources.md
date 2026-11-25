# UI source and implementation notes

shadcn/ui source: https://github.com/shadcn-ui/ui
Upstream checkout: 055aa6b7837b1808456a24beb4c97a677864aa82
MIT license retained in SHADCN-LICENSE.

Local copies of Button, Dialog, Tooltip, Tabs, Accordion, Select, Progress, Skeleton, Input, Textarea, Badge, Separator, Card, Table, Chart, Checkbox, Dropdown Menu and Scroll Area provide accessible primitives. Visual tokens and composition are specific to Spark.

Motion: https://github.com/motiondivision/motion
Recharts: https://github.com/recharts/recharts

Interaction references checked for this iteration:

- Motion layout and state transitions: https://motion.dev/docs/react-layout-animations
- shadcn chart composition: https://ui.shadcn.com/docs/components/base/chart
- React Flow animated edge examples: https://reactflow.dev/ui/components/animated-svg-edge

The decision network and scenario plot are custom Spark components using Motion and SVG.
React Flow was studied for graph behavior but is not imported; shadcn primitives remain
locally customized rather than using the default theme.

Private discovery notes and extracted third-party reference frames are intentionally excluded from the public source repository. No production data or API is connected.
