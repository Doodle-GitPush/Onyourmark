import { UploadCloud, RefreshCw } from "lucide-react"
import { useState } from "react"

interface SVGDropzoneProps {
    onSVGLoad: (svgText: string) => void
}

export function SVGDropzone({ onSVGLoad }: SVGDropzoneProps) {
    const [svgContent, setSvgContent] = useState<string>("")
    const [fileName, setFileName] = useState<string>("")

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = (file: File) => {
        if (file.type !== "image/svg+xml" && !file.name.endsWith(".svg")) {
            alert("Please upload an SVG file.")
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const text = e.target?.result
            if (typeof text === "string") {
                setSvgContent(text)
                setFileName(file.name)
                onSVGLoad(text)
            }
        }
        reader.readAsText(file)
    }

    const handleReplace = (e: React.MouseEvent) => {
        e.stopPropagation()
        // Reset the input so re-uploading the same file triggers onChange
        const input = document.getElementById("svg-upload") as HTMLInputElement
        if (input) {
            input.value = ""
            input.click()
        }
    }

    if (svgContent) {
        return (
            <div className="border border-white/[0.08] bg-[#0D0D0F] rounded-xl overflow-hidden">
                <div className="flex flex-col items-center justify-center p-4 text-center">
                    {/* SVG Preview — neutral light chip so any logo color (incl. black) stays visible */}
                    <div className="w-full aspect-square max-h-[120px] flex items-center justify-center rounded-lg bg-[#F4F4F5] p-4">
                        <div
                            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-[64px] [&>svg]:max-h-[64px] [&>svg]:object-contain"
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                    </div>
                    {/* File name */}
                    <p className="text-[10px] text-zinc-500 mt-2 truncate max-w-full">{fileName}</p>
                    {/* Replace button */}
                    <button
                        onClick={handleReplace}
                        className="mt-3 flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-zinc-300 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Replace Logo
                    </button>
                    <input
                        id="svg-upload"
                        type="file"
                        accept=".svg"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        )
    }

    return (
        <div
            className="border-[1.5px] border-dashed border-[#FF4800]/40 bg-white/[0.02] hover:bg-[#FF4800]/[0.04] hover:border-[#FF4800]/60 transition-colors cursor-pointer rounded-xl"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById("svg-upload")?.click()}
        >
            <div className="flex flex-col items-center justify-center p-8 py-10 text-center">
                <UploadCloud className="w-6 h-6 mb-3 text-zinc-300 stroke-[1.5]" />
                <p className="text-[13px] font-semibold tracking-tight text-zinc-200">Click or Drag and Drop an SVG</p>
                <p className="text-[10px] text-zinc-500 mt-1">Max File Size : 5MB</p>
                <input
                    id="svg-upload"
                    type="file"
                    accept=".svg"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    )
}
