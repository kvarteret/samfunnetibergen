import Link from "next/link"

export default function Forslag2() {
    return (
        <div className="text-8xl break-all">
            <span>
                IMPLEMENT YOUR OWN IDEA AT{" "}
                <Link
                    href={"https://github.com/kvarteret/samfunnetibergen"}
                    className="text-blue-500 whitespace-pre-wrap"
                >
                    github.com/kvarteret/samfunnetibergen
                </Link>
            </span>
        </div>
    )
}
