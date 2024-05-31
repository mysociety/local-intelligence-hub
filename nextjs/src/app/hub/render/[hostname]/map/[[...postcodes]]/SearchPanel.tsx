import { FormEvent, useState } from "react"

export function SearchPanel ({
    onSearch,
    isLoading
  }: {
    onSearch: (postcode: string) => void,
    isLoading: boolean
  }) {
    const [postcode, setPostcode] = useState("")
    const onSubmit = (e: FormEvent) => {
      e.preventDefault()
      onSearch(postcode)
    }
  
    return (
      <form onSubmit={onSubmit}>
        <h1 className='text-2xl font-bold mb-1 leading-tight'>
          Find out how you can support the climate and nature
        </h1>
        <p className='text-sm text-meepGray-500'>
          Explore our map of Husting events happening all over the uk or input your postcode to see what{"’"}s happening near you. We{"’"}ve had over 300+ events so far.
        </p>
        <input
          type="text"
          placeholder="Enter your postcode"
          className='p-4 text-lg w-full rounded-md border placeholder:text-jungle-green-600 focus:ring-jungle-green-600 bg-jungle-green-100 border-jungle-green-200 mt-4 active:border-green-500'
          value={postcode}
          onChange={e => setPostcode(e.target.value)}
        />
        <button
          className='bg-jungle-green-600 text-white text-lg font-bold rounded-md w-full p-4 mt-4'
          // TODO: add postcode validation
          disabled={!postcode || isLoading}
        >
          {isLoading ? 'Loading...' : 'Search'}
        </button>
      </form>
    )
  }
  