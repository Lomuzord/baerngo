import Script from "next/script"
import { BauenKamera } from "./BauenKamera"

export default function BauenPage() {
  return (
    <>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
      />
      <BauenKamera />
    </>
  )
}
