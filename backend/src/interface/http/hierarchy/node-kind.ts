export const NODE_KINDS = ['space', 'project', 'page'] as const;
export type NodeKind = (typeof NODE_KINDS)[number];
