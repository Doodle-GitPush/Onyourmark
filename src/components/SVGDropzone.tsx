import { Plus } from "lucide-react"
import { useState } from "react"

interface SVGDropzoneProps {
    onSVGLoad: (svgText: string) => void
}

export function SVGDropzone({ onSVGLoad }: SVGDropzoneProps) {
    const [svgContent, setSvgContent] = useState<string>("")
    const [fileName, setFileName] = useState<string>("")
    const [isDragOver, setIsDragOver] = useState(false)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = () => setIsDragOver(false)

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

    const handleReplace = () => {
        const input = document.getElementById("svg-upload") as HTMLInputElement
        if (input) {
            input.value = ""
            input.click()
        }
    }

    if (svgContent) {
        return (
            <div className="flex flex-col items-center gap-4">
                <div className="rounded-2xl bg-[#F4F4F5] p-8 flex items-center justify-center">
                    <div
                        className="[&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-[140px] [&>svg]:max-h-[140px] [&>svg]:object-contain"
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-600">
                    <span className="truncate max-w-[160px]">{fileName}</span>
                    <span className="text-zinc-700">·</span>
                    <button
                        onClick={handleReplace}
                        className="text-zinc-400 hover:text-zinc-100 underline underline-offset-4 decoration-zinc-700 transition-colors"
                    >
                        Replace
                    </button>
                </div>
                <input
                    id="svg-upload"
                    type="file"
                    accept=".svg"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        )
    }

    return (
        <div
            className={`flex flex-col items-center justify-center gap-4 py-28 cursor-pointer transition-colors ${isDragOver ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById("svg-upload")?.click()}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${isDragOver ? "border-[#FF4800] text-[#FF4800]" : "border-zinc-700"}`}>
                <Plus className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] tracking-tight">Drop your SVG, or click to browse</p>
            <input
                id="svg-upload"
                type="file"
                accept=".svg"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    )
}
