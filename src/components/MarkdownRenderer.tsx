import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by code blocks: ```language ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3.5 text-slate-800 leading-relaxed text-sm">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          // Extract language and code
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "code";
          const code = match ? match[2].trim() : part.slice(3, -3).trim();

          return <CodeBlock key={`cb-${index}`} language={lang} code={code} />;
        } else {
          return <TextBlock key={`tb-${index}`} text={part} />;
        }
      })}
    </div>
  );
}

interface CodeBlockProps {
  key?: string;
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 border border-gray-200 rounded-xl overflow-hidden bg-slate-950 shadow-xs">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 text-xs text-gray-300 border-b border-slate-800">
        <div className="flex items-center gap-2 font-mono">
          <Terminal size={14} className="text-blue-400" />
          <span className="font-bold">{language || "code"}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded hover:bg-slate-800 font-bold"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-xs md:text-sm text-blue-200 leading-relaxed bg-slate-950">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface TextBlockProps {
  key?: string;
  text: string;
}

function TextBlock({ text }: TextBlockProps) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushList = (key: number) => {
    if (currentList) {
      const listKey = `list-${key}`;
      if (currentList.type === "ul") {
        elements.push(
          <ul key={listKey} className="list-disc list-inside space-y-1 my-2 pl-4 text-slate-700 font-medium">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="marker:text-blue-500">{parseInlineStyles(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={listKey} className="list-decimal list-inside space-y-1 my-2 pl-4 text-slate-700 font-medium">
            {currentList.items.map((item, idx) => (
              <li key={idx}>{parseInlineStyles(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushTable = (key: number) => {
    if (inTable) {
      const tableKey = `table-${key}`;
      elements.push(
        <div key={tableKey} className="overflow-x-auto my-4 border border-gray-200 rounded-xl">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs md:text-sm bg-white">
            <thead className="bg-slate-50 text-slate-700 font-bold">
              <tr>
                {tableHeaders.map((header, idx) => (
                  <th key={idx} className="px-4 py-2 border-r border-gray-200 last:border-0 font-bold text-xs uppercase tracking-wider">
                    {parseInlineStyles(header.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-2 border-r border-gray-100 last:border-0 text-slate-600 font-medium">
                      {parseInlineStyles(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Table Row: | Header 1 | Header 2 |
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList(i);
      const cells = line.split("|").slice(1, -1);
      
      // Is it a separator row? (e.g., |---|---|)
      const isSeparator = cells.every(cell => cell.trim().match(/^-+$/));
      
      if (isSeparator) {
        // Just a delimiter, mark table is active
        inTable = true;
      } else if (!inTable) {
        // Treat as headers
        tableHeaders = cells;
        inTable = true;
      } else {
        // Add as rows
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Line is not a table row, flush previous table
      flushTable(i);
    }

    // Detect Headers
    if (line.startsWith("### ")) {
      flushList(i);
      elements.push(
        <h4 key={i} className="text-sm md:text-base font-bold text-slate-900 mt-4 mb-2">
          {parseInlineStyles(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      flushList(i);
      elements.push(
        <h3 key={i} className="text-base md:text-lg font-bold text-slate-900 mt-5 mb-3 border-b border-gray-100 pb-1">
          {parseInlineStyles(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      flushList(i);
      elements.push(
        <h2 key={i} className="text-lg md:text-xl font-bold text-slate-900 mt-6 mb-4">
          {parseInlineStyles(line.slice(2))}
        </h2>
      );
    }
    // Detect Bullet List: - item or * item
    else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const itemContent = line.trim().slice(2);
      if (!currentList) {
        currentList = { type: "ul", items: [itemContent] };
      } else if (currentList.type === "ul") {
        currentList.items.push(itemContent);
      } else {
        flushList(i);
        currentList = { type: "ul", items: [itemContent] };
      }
    }
    // Detect Numbered List: 1. item
    else if (/^\d+\.\s/.test(line.trim())) {
      const match = line.trim().match(/^\d+\.\s(.*)/);
      const itemContent = match ? match[1] : line.trim();
      if (!currentList) {
        currentList = { type: "ol", items: [itemContent] };
      } else if (currentList.type === "ol") {
        currentList.items.push(itemContent);
      } else {
        flushList(i);
        currentList = { type: "ol", items: [itemContent] };
      }
    }
    // Normal Line or Empty Line
    else {
      flushList(i);
      if (line.trim() === "") {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(
          <p key={i} className="text-slate-700 text-xs md:text-sm font-semibold mb-2 leading-relaxed">
            {parseInlineStyles(line)}
          </p>
        );
      }
    }
  }

  // Flush remaining lists or tables
  flushList(lines.length);
  flushTable(lines.length);

  return <div className="space-y-1">{elements}</div>;
}

// Simple parser for **bold** and `code` tags in inline text
function parseInlineStyles(text: string): React.ReactNode[] {
  // Regex to split by bold (**text**), code (`code`), or normal text
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-250 text-slate-900 font-mono text-[11px] md:text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
