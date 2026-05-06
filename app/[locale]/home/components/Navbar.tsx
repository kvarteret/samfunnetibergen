import Link from "next/link"

export default function Navbar() {
    return (
        <header className="p-4 flex justify-between">
            <Link className="md:text-xl lg:text-2xl" href={"/home"}>
                STUDENTERSAMFUNNET I BERGEN
            </Link>
            <div className="flex gap-4 md:text-sm lg:text-base">
                <Link href={"/arrangementer"}>ARRANGEMENTER</Link>
                <Link href={"/om-oss"}>OM OSS</Link>
                <Link href={"/blifrivillig"}>BLI FRIVILLIG</Link>
            </div>
        </header>
    )
}
