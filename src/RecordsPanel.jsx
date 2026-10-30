import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ClipboardList,
  Download,
  LoaderCircle,
  MapPin,
  Package,
  Plus,
  RefreshCw,
} from "lucide-react";
import RecordFilters from "./RecordFilters.jsx";
import { validMapPoints } from "./ui-preferences.mjs";
export default function RecordsPanel({
  records,
  filtered,
  more,
  loading,
  error,
  load,
  loadMore,
  canWrite,
  onRegister,
  onMap,
  exportCsv,
  search,
  setSearch,
  state,
  setState,
  sort,
  setSort,
}) {
  const [tablePage, setTablePage] = useState(0);
  useEffect(() => setTablePage(0), [search, state, sort]);
  const pageRecords = filtered.slice(tablePage * 25, tablePage * 25 + 25);
  const regions = new Set(
    records
      .map((r) =>
        String(r.state ?? "")
          .trim()
          .toLocaleLowerCase(),
      )
      .filter(Boolean),
  ).size;
  const showOnMap = (record) => (
    <button
      className="icon-button"
      title={`Show ${record.project} on map`}
      aria-label={`Show ${record.project} on map`}
      onClick={() => onMap(record.id)}
    >
      <ArrowUpRight size={18} />
    </button>
  );
  return (
    <section className="records-page">
      <div className="page-heading">
        <h1>Records</h1>
        {canWrite && (
          <button className="primary" onClick={onRegister}>
            <Plus size={18} />
            Register stove
          </button>
        )}
      </div>
      <div className="stats">
        <article>
          <div className="stat-label">
            STOVES REGISTERED
            <Package size={18} />
          </div>
          <strong>
            {records.length.toLocaleString()}
            {more ? "+" : ""}
          </strong>
          <span>
            {more
              ? "Loaded records · more available"
              : "Individual stove records"}
          </span>
        </article>
        <article>
          <div className="stat-label">
            STATES / REGIONS
            <ClipboardList size={18} />
          </div>
          <strong>{regions.toLocaleString()}</strong>
          <span>Where registered stoves are located</span>
        </article>
        <article>
          <div className="stat-label">
            LOCATIONS MAPPED
            <MapPin size={18} />
          </div>
          <strong>{validMapPoints(records).length.toLocaleString()}</strong>
          <span>Records with coordinates</span>
        </article>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <div className="data-panel">
        <div className="records-tools">
          <RecordFilters
            {...{ records, search, setSearch, state, setState, sort, setSort }}
          />
          <div className="button-row">
            <button
              className="secondary small"
              onClick={() => load()}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              className="secondary small"
              disabled={!filtered.length}
              onClick={exportCsv}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
        {loading && !records.length ? (
          <div className="empty">
            <LoaderCircle className="spin" />
            Loading records…
          </div>
        ) : (
          <>
            <div className="table-scroll desktop-records">
              <table>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Recipient</th>
                    <th>Location</th>
                    <th>Model</th>
                    <th>Date</th>
                    <th>
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.project}</strong>
                        <small>{r.phone || "—"}</small>
                      </td>
                      <td>{r.name}</td>
                      <td>
                        {r.address}
                        <small>
                          {r.state} · {r.latitude}, {r.longitude}
                        </small>
                      </td>
                      <td>Save80</td>
                      <td aria-label="Date not displayed" />
                      <td>{showOnMap(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-records">
              {pageRecords.map((r) => (
                <article className="record-card" key={r.id}>
                  <div className="record-card-heading">
                    <strong>{r.project}</strong>
                    {showOnMap(r)}
                  </div>
                  <h2>{r.name}</h2>
                  <p>{r.address}</p>
                  <dl>
                    <div>
                      <dt>State / region</dt>
                      <dd>{r.state}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{r.phone || "—"}</dd>
                    </div>
                    <div>
                      <dt>Coordinates</dt>
                      <dd>
                        {r.latitude}, {r.longitude}
                      </dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd aria-label="Date not displayed" />
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            {!filtered.length && (
              <div className="empty">
                <ClipboardList size={28} />
                <strong>
                  {error
                    ? "Records could not be loaded"
                    : "No records to display"}
                </strong>
                <span>
                  {error
                    ? "Use Refresh to try again."
                    : "Register a stove or adjust your search."}
                </span>
              </div>
            )}
            <div className="pagination">
              <span>
                {filtered.length ? tablePage * 25 + 1 : 0}–
                {Math.min((tablePage + 1) * 25, filtered.length)} of{" "}
                {filtered.length} loaded records
              </span>
              <div className="button-row">
                <button
                  className="secondary small"
                  disabled={tablePage === 0}
                  onClick={() => setTablePage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="secondary small"
                  disabled={(tablePage + 1) * 25 >= filtered.length}
                  onClick={() => setTablePage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
        {more && (
          <div className="load-more">
            <p className="muted small-text">
              Search, totals and export cover loaded records.
            </p>
            <button className="secondary" disabled={loading} onClick={loadMore}>
              {loading ? "Loading…" : "Load older records"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
