// Marco de celular. El micrositio va adentro y se desplaza como en un celular de verdad.
export default function PhoneFrame({ className = "", children }) {
  return (
    <div className={`lp-phone ${className}`}>
      <div className="lp-screen">{children}</div>
    </div>
  );
}
