"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extensions";
import { useEffect } from "react";
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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: includeHeading ? { levels: [2] } : false,
        bulletList: false,
        orderedList: false,
        listItem: false,
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
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
    ],
    content: markdownToHtml(value),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
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
    const current = editor.getHTML();
    const currentNormalized = current === "<p></p>" ? "" : current;
    if (incoming !== currentNormalized) {
      editor.commands.setContent(incoming || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const openLinkPrompt = () => {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("Enter URL (e.g. https://example.com):", prev || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^https?:\/\//i.test(url.trim())) {
      alert("Please enter a valid URL starting with https:// or http://");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const btnClass = (active: boolean) =>
    `flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 transition-colors ${
      active
        ? "bg-brand/20 text-dark"
        : "text-dark hover:bg-gray-200 active:bg-gray-300"
    }`;

  const minHeight = `${Math.max(rows, 3) * 1.6}rem`;

  return (
    <div>
      <div className="flex items-center gap-0.5 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-1.5 py-1">
        {includeHeading && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={btnClass(editor?.isActive("heading", { level: 2 }) ?? false)}
            title="Heading"
            aria-label="Heading"
          >
            <span className="text-sm font-semibold">H</span>
          </button>
        )}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={btnClass(editor?.isActive("bold") ?? false)}
          title="Bold (Cmd/Ctrl+B)"
          aria-label="Bold"
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
        >
          <span className="font-serif text-base italic font-semibold">I</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkPrompt}
          className={btnClass(editor?.isActive("link") ?? false)}
          title="Link (Cmd/Ctrl+K)"
          aria-label="Link"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
