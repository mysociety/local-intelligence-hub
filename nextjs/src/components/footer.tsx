import { CommonKnowledgeLogo, CiviPowerFundLogo } from '@/components/logos';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="p-lg flex flex-row justify-between items-center">
            <div className="flex flex-row items-center gap-[100px]">
                <Link href="https://commonknowledge.coop/"><CommonKnowledgeLogo /></Link>
                <Link href="https://www.civicpower.org.uk/">   <CiviPowerFundLogo /></Link></div>
            <Link href="/" className="text-muted font-IBMPlexMono text-[15px] tracking-[-0.3px] leading-[150%]">Privacy policy</Link>
        </footer>)


}
