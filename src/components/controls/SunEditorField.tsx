import { useMemo } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Controller, FieldValues, useFormContext } from "react-hook-form";

import "suneditor/dist/css/suneditor.min.css";

const SunEditor = dynamic(
  async () => (await import("suneditor-react")).default,
  { ssr: false }
) as any;

interface SunEditorFieldConfig {
  layout?: string;
  direction?: "horizontal" | "vertical" | string;
  height?: string;
  [key: string]: unknown;
}

interface SunEditorFieldProps {
  label?: ReactNode;
  configs: SunEditorFieldConfig;
  rules?: Record<string, unknown>;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  editorLoaded?: boolean;
  name: string;
  labelWidth?: string;
  inputWidth?: string;
  menuPlacement?: unknown;
  options?: unknown;
  change?: unknown;
  components?: unknown;
  onChange?: unknown;
  value?: unknown;
  basic?: unknown;
}

const handleImageUpload = (imageElement: HTMLImageElement | null) => {
  if (!imageElement) return;

  // Keep original image size so center/align behavior is stable after upload.
  const originSize = imageElement.attributes
    ?.getNamedItem("origin-size")
    ?.value;

  if (originSize && !imageElement.style.width && !imageElement.style.height) {
    const [width, height] = originSize.split(",");
    imageElement.style.width = `${width}px`;
    imageElement.style.height = `${height}px`;
    return;
  }

  if (!originSize) {
    imageElement.style.width = "100%";
    imageElement.style.height = "100%";
  }
};

export default function SunEditorField({
  label,
  configs,
  rules,
  defaultValue,
  placeholder,
  className,
  editorLoaded,
  name,
  labelWidth = "",
  inputWidth = "",
}: SunEditorFieldProps) {
  const methods = useFormContext<FieldValues>();

  const direction = configs?.direction || "vertical";
  const layout = configs?.layout || "5|5";
  const labelText = label || "";
  const defaultContent = defaultValue || "";
  const placeholderText = placeholder || "";
  const formRules = rules || {};

  const [labelCol, inputCol] = useMemo(() => {
    const [left = "5", right = "5"] = layout.split("|");
    return [`col-${left}`, `col-${right}`];
  }, [layout]);

  const editorOptions = useMemo(
    () => ({
      height: configs?.height || "350px",
      width: "100%",
      buttonList: [
        ["undo", "redo"],
        ["font", "fontSize", "formatBlock"],
        ["paragraphStyle", "blockquote"],
        ["bold", "underline", "italic", "strike", "subscript", "superscript"],
        ["fontColor", "hiliteColor", "textStyle"],
        ["removeFormat"],
        ["outdent", "indent"],
        ["align", "horizontalRule", "list", "lineHeight"],
        ["table", "link", "image", "video", "audio"],
        ["fullScreen", "showBlocks", "codeView"],
        ["preview", "print"],
        ["save", "template"],
      ],
      font: [
        "Arial",
        "Comic Sans MS",
        "Courier New",
        "Impact",
        "Georgia",
        "tahoma",
        "Trebuchet MS",
        "Verdana",
      ],
      fontSize: [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
      formats: ["p", "div", "blockquote", "pre", "h1", "h2", "h3", "h4", "h5", "h6"],
      colorList: [
        ["#ccc", "#dedede", "OrangeRed", "Orange", "RoyalBlue", "SaddleBrown"],
        ["SlateGray", "BurlyWood", "DeepPink", "FireBrick", "Gold", "SeaGreen"],
      ],
      lineHeights: [
        { text: "1", value: 1 },
        { text: "1.15", value: 1.15 },
        { text: "1.5", value: 1.5 },
        { text: "2", value: 2 },
      ],
      paragraphStyles: ["spaced", "neon"],
      textStyles: ["translucent", "shadow"],
      showPathLabel: false,
      imageGalleryUrl:
        "https://etyswjpn79.execute-api.ap-northeast-1.amazonaws.com/suneditor-demo",
      imageUrlInput: false,
      imageFileInput: false,
      videoFileInput: false,
      tabDisable: false,
      resizeEnable: true,
      stickyToolbar: true,
      pasteTagsWhitelist:
        "p|div|h1|h2|h3|h4|h5|h6|blockquote|pre|span|strong|em|u|s|sub|sup|strike|a|img|br|hr|ul|ol|li|table|thead|tbody|tfoot|tr|th|td|caption|col|colgroup",
      attributesWhitelist: {
        all: "style|class|id|data-*",
        table: "cellspacing|cellpadding|border|align|width|height|style|class",
        td: "colspan|rowspan|align|valign|width|height|style|class|background-color",
        th: "colspan|rowspan|align|valign|width|height|style|class|background-color",
        img: "src|alt|width|height|style|class|title|max-width",
        a: "href|target|title|rel|style|class",
        span: "style|class",
        div: "style|class|align",
        p: "style|class|align",
      },
      removeFormatExclusionTags: "table|thead|tbody|tfoot|tr|th|td|img|span",
      allowedStyleTags: "",
      popover: {
        image: [
          ["imagePopoverRemove", "imagePopoverCopyLink"],
          ["imagePopoverAlign", "imagePopoverWidth", "imagePopoverHeight"],
        ],
        link: [["linkPopoverEdit", "linkPopoverRemove"]],
        air: [
          ["color", "bold", "underline", "italic"],
          ["removeFormat", "clear"],
        ],
      },
    }),
    [configs?.height]
  );

  if (!editorLoaded) {
    return <div>Editor loading</div>;
  }

  const editorNode = (
    <Controller
      name={name}
      defaultValue={defaultContent}
      rules={formRules}
      control={methods.control}
      render={({ field, fieldState }) => {
        const fieldValue = (field.value as string) ?? "";

        return (
          <>
            <SunEditor
              width="100%"
              height={configs?.height || "350px"}
              setOptions={editorOptions}
              onChange={(dataChanged: string) => field.onChange(dataChanged)}
              onImageUpload={handleImageUpload}
              setContents={fieldValue}
              placeholder={placeholderText}
            />
            {fieldState.error && (
              <small className="p-error block mt-1">{fieldState.error.message}</small>
            )}
          </>
        );
      }}
    />
  );

  if (direction === "horizontal") {
    return (
      <div className={`flex justify-content-center align-items-center gap-3 ${className || ""}`}>
        <label className={labelWidth || labelCol}>{labelText}</label>
        <div className={inputWidth || inputCol}>{editorNode}</div>
      </div>
    );
  }

  return (
    <div className="form-group flex flex-column gap-3">
      <label className={labelWidth}>{labelText}</label>
      <div className="flex-grow-1">{editorNode}</div>
    </div>
  );
}
