/**
 * Remark plugin that converts Starlight-style container directives
 * (:::note, :::tip, :::caution, :::danger) into styled HTML elements
 * compatible with next-mdx-remote rendering.
 *
 * Requires `remark-directive` to run before this plugin.
 */
import type { Plugin } from "unified";
import type { Root, Node, Paragraph } from "mdast";
import { visit } from "unist-util-visit";

interface DirectiveNode extends Node {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string>;
  children: Array<Node & { data?: Record<string, unknown>; children?: Node[] }>;
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
}

function isDirective(node: Node): node is DirectiveNode {
  return (
    node.type === "containerDirective" ||
    node.type === "leafDirective" ||
    node.type === "textDirective"
  );
}

const CALLOUT_TYPES = new Set(["note", "tip", "caution", "danger", "warning"]);

const CALLOUT_LABELS: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  caution: "Caution",
  danger: "Danger",
  warning: "Warning",
};

/**
 * Extract text content from mdast children recursively.
 */
function extractText(nodes: Node[]): string {
  return nodes
    .map((n: any) => {
      if (n.type === "text") return n.value;
      if (n.children) return extractText(n.children);
      return "";
    })
    .join("");
}

const remarkCallouts: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, (node: Node) => {
      if (!isDirective(node)) return;
      if (node.type !== "containerDirective") return;

      const name = node.name.toLowerCase();
      if (!CALLOUT_TYPES.has(name)) return;

      // Extract label from :::note[Custom Title] syntax.
      // mdast-util-directive stores this as the first child paragraph
      // with data.directiveLabel = true
      let label = CALLOUT_LABELS[name] || "Note";
      const bodyChildren: Node[] = [];

      for (const child of node.children) {
        if (
          child.type === "paragraph" &&
          child.data?.directiveLabel === true &&
          child.children
        ) {
          label = extractText(child.children as Node[]) || label;
        } else {
          bodyChildren.push(child);
        }
      }

      // Convert to a div with data attributes for CSS styling
      node.data = node.data || {};
      node.data.hName = "div";
      node.data.hProperties = {
        className: `callout callout-${name}`,
        "data-callout": name,
      };

      // Create title element
      const titleNode: any = {
        type: "paragraph",
        data: {
          hName: "div",
          hProperties: { className: "callout-title" },
        },
        children: [{ type: "text", value: label }],
      };

      node.children = [titleNode, ...bodyChildren];
    });
  };
};

export default remarkCallouts;
