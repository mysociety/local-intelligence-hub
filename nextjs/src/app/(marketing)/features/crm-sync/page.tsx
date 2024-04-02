import MarketingPageHeader from "@/components/marketing/MarkertingPageHeader";
import { Card, CardTitle, CardHeader, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import TemplateTextBlock from "@/components/marketing/TemplateTextBlock";
import FeaturesOption from "@/components/marketing/FeaturesOption";

export default function DataEnrichment() {

  let btnLink = "/signup"

  return (
      <FeaturesOption
        labelHeading="CRM Sync"
        heading={<>Upgrade your <span className="md:text-hXlgPP text-hLgPP font-PPRightGrotesk">workflow</span> by seamlessly integrating mapped your chosen CRM</>}
        description="Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data."
        btnText="Get Started"
        btnLink="/login"
        screenshot="/mapping-screenshot.png"

        benefitsHeading="Connect your mailing list to Mapped and see where they are"
       
        b1Screenshot="/mapping-screenshot.png"
        b1Heading="Sync memberships"
        b1Description="Upload a spreadsheet with a column of postcodes to get extra geographic data added on that can help you with your organising efforts."
      
        b2Screenshot="/mapping-screenshot.png"
        b2Heading="Sync memberships"
        b2Description="Upload a spreadsheet with a column of postcodes to get extra geographic data added on that can help you with your organising efforts."
        
        b3Screenshot="/mapping-screenshot.png"
        b3Heading="Sync memberships"
        b3Description="Upload a spreadsheet with a column of postcodes to get extra geographic data added on that can help you with your organising efforts."
     />
  );
}
