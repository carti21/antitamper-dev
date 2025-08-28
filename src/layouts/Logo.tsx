import logoUrl from '../assets/image 2.jpg';

function Logo() {
    return (
        <div className="flex justify-center w-full">
            <img src={logoUrl} alt="BYTRONICS Logo" className="h-30  object-contain"  /> 
        </div>
    )
}

export default Logo