import { CommonKnowledgeLogo, CiviPowerFundLogo, JRRTLogo } from '@/components/logos';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className=" py-8  gap-1 flex md:flex-row flex-col justify-between items-center border-t border-meepGray-700">
            <div className="flex md:flex-row flex-col items-center gap-8 pt-md">
                <Link href="https://commonknowledge.coop/"><CommonKnowledgeLogo /></Link>
                <Link href="https://www.civicpower.org.uk/"><CiviPowerFundLogo /></Link>
                <Link href="https://www.jrrt.org.uk/" className='h-10 w-40'><JRRTLogo /></Link>

            </div>
            <Link href="/" className="text-meepGray-500 font-IBMPlexMono text-[15px] tracking-[-0.3px] leading-[150%]">Privacy policy</Link>
            
        </footer>)
}
