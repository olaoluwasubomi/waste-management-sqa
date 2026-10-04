interface Props {
  onCreated: () => void;
}
export default function WasteFilters() {
  return (
    <div className="py-10 px-4 shadow-2xl border border-white rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-9">
            <input
                type="text"
                placeholder="Search waste types..."
               className="border-b px-3 py-2 w-full outline-none"
            />
            <input
                type="text"
                placeholder="Search waste types..."
               className="border-b px-3 py-2 w-full outline-none"
            />

            <select className="border-b px-3 py-2 w-full outline-none">
                <option>All</option>
                <option>Active</option>
                <option>Inactive</option>
            </select>
        </div>
    </div>
  )
}