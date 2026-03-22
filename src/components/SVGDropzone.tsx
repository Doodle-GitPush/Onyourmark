import {
    Card,
    CardContent,
} from "@/components/ui/card"
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
            <Card className="border border-slate-200 bg-white rounded-[14px] shadow-none m-0 overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                    {/* SVG Preview */}
                    <div
                        className="w-full aspect-square max-h-[120px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-[80px] [&>svg]:max-h-[80px] [&>svg]:object-contain"
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                    {/* File name */}
                    <p className="text-[10px] text-slate-400 mt-2 truncate max-w-full">{fileName}</p>
                    {/* Replace button */}
                    <button
                        onClick={handleReplace}
                        className="mt-3 flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
                </CardContent>
            </Card>
        )
    }

    return (
        <Card
            className="border-[1.5px] border-dashed border-[#FF8A50] bg-white hover:bg-orange-50/30 transition-colors cursor-pointer rounded-[14px] shadow-none m-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById("svg-upload")?.click()}
        >
            <CardContent className="flex flex-col items-center justify-center p-8 py-10 text-center text-slate-800">
                <UploadCloud className="w-6 h-6 mb-3 text-slate-800 stroke-[1.5]" />
                <p className="text-[13px] font-bold tracking-tight">Click or Drag and Drop an SVG</p>
                <p className="text-[10px] text-slate-400 mt-1">Max File Size : 5MB</p>
                <input
                    id="svg-upload"
                    type="file"
                    accept=".svg"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </CardContent>
        </Card>
    )
}
