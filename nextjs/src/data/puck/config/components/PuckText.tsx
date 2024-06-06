import React from 'react'

export function PuckText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((para, i) => (
        <p key={i} className='mb-2'>{para}</p>
      ))}
    </>
  )
}