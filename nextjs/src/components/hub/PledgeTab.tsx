export function PledgeTab() {
  const onSubmit = () => {}
  return (
    <>
      <h3 className="text-2xl text-hub-primary-950 font-bold mb-4">
        {" "}
        Save the date! Prepare to meet your MP on Saturday 12 October.
      </h3>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="postcode"
          autoComplete="postal-code"
          className="p-4 text-lg w-full rounded-md border placeholder:text-hub-primary-600 focus:ring-hub-primary-600 bg-hub-primary-50 border-hub-primary-100 mt-4 active:border-hub-primary-500"
          value={""}
          onChange={(e) => false}
        />
        <button
          className="bg-hub-primary-600 text-white text-lg font-bold rounded-md w-full p-4 mt-4"
          disabled={false}
        >
          {false ? "Loading..." : "Search"}
        </button>
      </form>
    </>
  );
}
