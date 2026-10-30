import { Search, X } from "lucide-react";
export default function RecordFilters({
  records,
  search,
  setSearch,
  state,
  setState,
  sort,
  setSort,
}) {
  return (
    <div className="record-filters">
      <div className="search-input">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Search records"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Product ID, recipient or address"
        />
        {search && (
          <button
            type="button"
            className="icon-button"
            aria-label="Clear search"
            onClick={() => setSearch("")}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <select
        aria-label="Filter by state or region"
        value={state}
        onChange={(e) => setState(e.target.value)}
      >
        <option value="">All states / regions</option>
        {[...new Set(records.map((r) => r.state).filter(Boolean))]
          .sort()
          .map((s) => (
            <option key={s}>{s}</option>
          ))}
      </select>
      {setSort && (
        <select
          aria-label="Sort records"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="name">Recipient A–Z</option>
          <option value="project">Product ID A–Z</option>
        </select>
      )}
    </div>
  );
}
