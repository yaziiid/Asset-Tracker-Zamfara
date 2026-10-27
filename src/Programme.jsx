import {
  Leaf,
  TreePine,
  CookingPot,
  HeartHandshake,
  ArrowLeft,
} from "lucide-react";

export function PartnerLogos({ compact = false }) {
  return (
    <div
      className={`partner-lockup ${compact ? "partner-lockup-compact" : ""}`}
      aria-label="A collaboration between TBCN and atmosfair"
    >
      <div className="tbcn-partner">
        <img src="/tbcn-logo.png" alt="" />
        <strong>TBCN</strong>
      </div>
      <span className="partner-divider" aria-hidden="true" />
      <img
        className="atmosfair-partner"
        src="/atmosfair-logo.png"
        alt="atmosfair"
      />
    </div>
  );
}

export function ProgrammePage({ onBack }) {
  return (
    <section className="programme-page">
      {onBack && (
        <button className="text-button programme-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to sign in
        </button>
      )}
      <div className="programme-intro">
        <div>
          <span className="eyebrow">THE SAVE80 PROGRAMME</span>
          <h1>
            Less firewood.
            <br />
            <em>More possibility.</em>
          </h1>
          <p>
            Fuel-efficient cooking starts at home. Save80 helps households make
            more of the firewood they use every day.
          </p>
          <PartnerLogos />
          <p className="partnership-caption">
            A collaboration between TBCN and atmosfair.
          </p>
        </div>
        <figure>
          <img
            src="/save80-stove.jpg"
            alt="A stainless-steel Save80 stove using small sticks of firewood"
          />
          <figcaption>
            Save80 stove. Photo: Habiba Ali (2008), reproduced from the supplied
            bigEE technology guide.
          </figcaption>
        </figure>
      </div>
      <div className="programme-benefits">
        <article>
          <TreePine />
          <h2>Make wood go further</h2>
          <p>
            The Save80 design uses small pieces of wood efficiently, helping
            reduce the firewood needed for household cooking compared with
            traditional open fires.
          </p>
        </article>
        <article>
          <CookingPot />
          <h2>Keep the heat working</h2>
          <p>
            A cooking pot and retained-heat “Wonderbox” work together: after
            heating on the stove, food can continue cooking using retained heat.
          </p>
        </article>
        <article>
          <HeartHandshake />
          <h2>Keep households connected</h2>
          <p>
            This workspace helps programme teams record recipients, stove
            references and delivery locations, and support communities across
            states and regions.
          </p>
        </article>
      </div>
      <div className="programme-source">
        <Leaf size={19} />
        <div>
          <strong>Purpose, with a clear record.</strong>
          <p>
            Product background: Oliver Adria,{" "}
            <cite>Good Practice Technology: Save 80 Stove</cite>, bigEE /
            Wuppertal Institute, September 2014, pp. 3–6. This is historical
            technology information; field performance varies with use and
            conditions. Registration counts do not establish verified fuel
            savings or carbon credits.
          </p>
        </div>
      </div>
    </section>
  );
}
