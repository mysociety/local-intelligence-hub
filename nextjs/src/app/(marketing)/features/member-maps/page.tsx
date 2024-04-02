import MarketingPageHeader from "@/components/marketing/MarkertingPageHeader";
import { Card, CardTitle, CardHeader, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import FeaturesOption from "@/components/marketing/FeaturesOption";
import { Metadata } from 'next'


export default function MemberMaps() {

  let btnLink = "/signup"

  return (
         <FeaturesOption
        labelHeading="Member Maps"
        heading={<>See where your <span className="md:text-hXlgPP text-hLgPP font-PPRightGrotesk">members</span> are and reach them easily</>}
        description="Take your organising to the next level with our free to use tools that enhance your existing membership lists with geographic and political data."
        btnText="Get Started"
        btnLink={btnLink}
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
export const metadata: Metadata = {
  title: 'CRM Sync',
}