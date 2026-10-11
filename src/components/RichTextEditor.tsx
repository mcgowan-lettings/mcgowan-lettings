"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { useEffect, useRef } from "react";
import { markdownToHtml } from "@/lib/rich-text";

type Props = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  includeHeading?: boolean;
  /** id of the visible label element, so screen readers name the editor. */
  labelledBy?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  rows = 6,
  placeholder,
  includeHeading = false,
  labelledBy,
}: Props) {
  // Set below once the editor exists; lets the Mod-k key handler (configured
  // before the editor is created) open the same prompt as the toolbar button.
  const linkPromptRef = useRef<() => void>(() => {});
  const editor = useEditor({
    extensions: [
      // The schema must be able to represent everything sanitizeHtml allows
      // (p, br, strong/b, em/i, u, a, h2, h3, ul, ol, li, tables): any node TipTap
      // can't represent is silently dropped the moment the content loads, and
      // the next save would then flatten the stored post for good. So lists
      // and h2/h3 (and tables — two published posts contain them) are always
      // in the schema; `includeHeading` only controls which toolbar buttons
      // are offered.
      StarterKit.configure({
        heading: { levels: [2, 3] },
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
          class: "text-brand-dark underline",
        },
      }),
      // No column resizing: the site renders tables at full width via
      // .rich-content, and sanitizeHtml strips the colwidth/style it'd write.
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
    ],
    content: markdownToHtml(value),
    immediatelyRender: false,
    // TipTap 3 doesn't re-render on selection changes by default, which left
    // the toolbar's active/aria-pressed state stale while moving the caret.
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      // isEmpty also catches "<p></p><p></p>" (Enter on an empty doc), which
      // would otherwise save and render an empty "Description" section.
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
    editorProps: {
      // Cmd/Ctrl+K opens the link prompt (advertised in the button tooltip).
      handleKeyDown: (_view, event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          !event.altKey &&
          !event.shiftKey &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          linkPromptRef.current();
          return true;
        }
        return false;
      },
      attributes: {
        class:
          // text-base below sm: iOS Safari zooms into fields under 16px.
          "tiptap-content focus:outline-none px-4 py-2.5 text-base sm:text-sm text-dark leading-relaxed",
        role: "textbox",
        "aria-multiline": "true",
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = markdownToHtml(value);
    const currentNormalized = editor.isEmpty ? "" : editor.getHTML();
    if (incoming !== currentNormalized) {
      editor.commands.setContent(incoming || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const openLinkPrompt = () => {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
    const input = window.prompt(
      "Enter a web address (https://…), email (mailto:…) or phone (tel:…):",
      prev || "https://"
    );
    if (input === null) return;
    const url = input.trim();
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    // Same schemes sanitizeHtml keeps (http, https, mailto, tel).
    if (!/^(https?:\/\/\S|mailto:\S|tel:\S)/i.test(url)) {
      alert("Please enter a link starting with https://, http://, mailto: or tel:");
      return;
    }
    const { empty } = editor.state.selection;
    if (empty && !editor.isActive("link")) {
      // Nothing selected: insert the address itself as the linked text
      // (without the mailto:/tel: prefix), rather than silently doing nothing.
      const text = url.replace(/^(mailto|tel):/i, "");
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text, marks: [{ type: "link", attrs: { href: url } }] })
        .unsetMark("link")
        .run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  useEffect(() => {
    linkPromptRef.current = openLinkPrompt;
  });

  const btnClass = (active: boolean) =>
    // 44px touch targets (WCAG 2.5.5 / Apple HIG) — David edits on an iPad.
    `flex h-11 min-w-[2.75rem] items-center justify-center rounded-md px-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
      active
        ? "bg-brand/20 text-dark"
        : "text-dark hover:bg-gray-200 active:bg-gray-300"
    }`;

  const minHeight = `${Math.max(rows, 3) * 1.6}rem`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-1.5 py-1">
        {includeHeading && (
          <>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={btnClass(editor?.isActive("heading", { level: 2 }) ?? false)}
              title="Heading"
              aria-label="Heading"
              aria-pressed={editor?.isActive("heading", { level: 2 }) ?? false}
            >
              <span className="text-sm font-semibold">H2</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={btnClass(editor?.isActive("heading", { level: 3 }) ?? false)}
              title="Subheading"
              aria-label="Subheading"
              aria-pressed={editor?.isActive("heading", { level: 3 }) ?? false}
            >
              <span className="text-xs font-semibold">H3</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={btnClass(editor?.isActive("bulletList") ?? false)}
              title="Bullet list"
              aria-label="Bullet list"
              aria-pressed={editor?.isActive("bulletList") ?? false}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={btnClass(editor?.isActive("orderedList") ?? false)}
              title="Numbered list"
              aria-label="Numbered list"
              aria-pressed={editor?.isActive("orderedList") ?? false}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 6.75h10.5M9.75 12h10.5m-10.5 5.25h10.5" />
                <text x="2.5" y="8.5" fontSize="6" fill="currentColor" stroke="none" fontWeight="700">1</text>
                <text x="2.5" y="14" fontSize="6" fill="currentColor" stroke="none" fontWeight="700">2</text>
                <text x="2.5" y="19.5" fontSize="6" fill="currentColor" stroke="none" fontWeight="700">3</text>
              </svg>
            </button>
          </>
        )}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={btnClass(editor?.isActive("bold") ?? false)}
          title="Bold (Cmd/Ctrl+B)"
          aria-label="Bold"
          aria-pressed={editor?.isActive("bold") ?? false}
        >
          <span className="text-sm font-bold">B</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={btnClass(editor?.isActive("italic") ?? false)}
          title="Italic (Cmd/Ctrl+I)"
          aria-label="Italic"
          aria-pressed={editor?.isActive("italic") ?? false}
        >
          <span className="font-serif text-base italic font-semibold">I</span>
        </button>
        {includeHeading && (
          <>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                editor?.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()
              }
              className={btnClass(false)}
              title="Insert table"
              aria-label="Insert table"
              disabled={!editor || editor.isActive("table")}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 5.25h17.25v13.5H3.375V5.25zM3.375 9.75h17.25M3.375 14.25h17.25M12 9.75v9" />
              </svg>
            </button>
            {editor?.isActive("table") && (
              <>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className={btnClass(false)}
                  title="Add table row"
                  aria-label="Add table row"
                >
                  <span className="text-xs font-semibold">+Row</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className={btnClass(false)}
                  title="Add table column"
                  aria-label="Add table column"
                >
                  <span className="text-xs font-semibold">+Col</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className={btnClass(false)}
                  title="Delete table row"
                  aria-label="Delete table row"
                >
                  <span className="text-xs font-semibold">−Row</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (window.confirm("Delete this whole table?")) {
                      editor.chain().focus().deleteTable().run();
                    }
                  }}
                  className={btnClass(false)}
                  title="Delete table"
                  aria-label="Delete table"
                >
                  <span className="text-xs font-semibold text-red-600">Del table</span>
                </button>
              </>
            )}
          </>
        )}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkPrompt}
          className={btnClass(editor?.isActive("link") ?? false)}
          title="Link (Cmd/Ctrl+K)"
          aria-label="Link"
          aria-pressed={editor?.isActive("link") ?? false}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </button>
        <span className="ml-auto hidden pr-1 text-[11px] text-text-muted sm:inline">
          Select text, then click a button
        </span>
      </div>
      <div
        className="rounded-b-lg border border-gray-300 bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand"
        style={{ minHeight }}
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
