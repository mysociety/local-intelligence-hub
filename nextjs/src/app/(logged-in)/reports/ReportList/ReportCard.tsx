'use client'

import { formatRelative } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

import { ListReportsQuery } from '@/__generated__/graphql'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ReportCard({
  report,
}: {
  report: ListReportsQuery['reports'][0]
}) {
  return (
    <Link href={`/reports/${report.id}`}>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="mb-1 px-5 pt-4">{report.name}</CardTitle>
          <CardDescription className="text-sm text-meepGray-400 px-5 pb-5">
            Edited{' '}
            <span className="text-meepGray-300">
              {formatRelative(report.lastUpdate, new Date()).split(' at ')[0]}
            </span>
          </CardDescription>
          <CardContent className="relative h-[200px]">
            <Image
              src={
                report.coverImageAbsoluteUrl ?? '/reports_page_card_image.png'
              }
              alt="Description of the image"
              fill
              className="w-full"
              objectFit="cover"
              objectPosition="center"
            />
          </CardContent>
        </CardHeader>
      </Card>
    </Link>
  )
}
