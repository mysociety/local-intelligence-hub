import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"

export default function Report() {

  return (
    <>

      <div className="flex flex-row justify-between mb-16">
        <div>
          <h1 className="text-hLg mb-7">Reports</h1>
          <p className="text-meepGray-400 w-[400px]">Maximise your organisations impact by securely connecting your CRM platforms with Mapped and select from a range of data sources to enhance your membership lists.</p>
        </div>
        <Image src="/reports_page_screenshot.png" alt="Description of the image" width={500} height={300} />
      </div>
      <p className="mb-lg"> Your team’s reports</p>
      <div className="flex flex-row gap-lg">
        <Card>
          <CardHeader>
            <CardContent>
              <Image src="/reports_page_card_image.png" alt="Description of the image" width={300} height={300} />
            </CardContent>
            <CardTitle className="mb-3 px-6 pt-6">Main Members 2024</CardTitle>
            <CardDescription className="text-[12px] text-meepGray-400 px-6 pb-6">Last Edited: 27 Feb 2024</CardDescription>
          </CardHeader>
        </Card>
        <Card className="flex flex-col justify-center">
          <CardContent className="px-6">
            <Button className="rounded-none	" variant="reverse">Create new report</Button>

          </CardContent>
        </Card>
      </div>
    </>
  );
}
