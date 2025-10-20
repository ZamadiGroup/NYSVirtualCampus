import { MaterialCard } from "../MaterialCard";

export default function MaterialCardExample() {
  const today = new Date();

  return (
    <div className="space-y-3 p-6 max-w-2xl">
      <MaterialCard
        id="1"
        title="Introduction to Databases - Lecture Notes.pdf"
        type="pdf"
        size="2.4 MB"
        uploadedAt={today}
        onDownload={() => console.log("Download material")}
        onView={() => console.log("View material")}
      />
      <MaterialCard
        id="2"
        title="Database Normalization Tutorial Video"
        type="video"
        size="45 MB"
        uploadedAt={today}
        onDownload={() => console.log("Download material")}
        onView={() => console.log("View material")}
      />
      <MaterialCard
        id="3"
        title="SQL Practice Exercises - External Resource"
        type="link"
        uploadedAt={today}
        onView={() => console.log("Open link")}
      />
    </div>
  );
}
