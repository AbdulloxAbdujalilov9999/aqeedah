export default function SearchBar({ lang, placeholder, button, value = "" }: { lang: string; placeholder: string; button: string; value?: string }) {
  return (
    <form className="searchbar" action={`/${lang}/search`} role="search">
      <input id="q" type="search" name="q" defaultValue={value} placeholder={placeholder} aria-label={button} required minLength={2} />
      <button className="btn lapis" type="submit">{button}</button>
    </form>
  );
}
