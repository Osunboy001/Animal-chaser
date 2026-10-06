import {Link} from "react-router-dom"
import { useEffect,useState}  from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
import "./dashboard.css"
function Dashboard () {
    
const [detects, setDetect] = useState([])
    useEffect( () => {
        async function fetchDetect() {
            const res = await fetch(`${API_URL}/api/v1/detection/getdata`,)
            const data = await res.json()
            setDetect(data.detections)
        }

fetchDetect() 

    }, [])


return (
  <div className="dashboard">

         <div>
          <Link className="home-link" to ="/">
            <button className="homebtn">	&#x2190; Home</button>
            
          </Link>
        </div>

    <div className="dashboard-title">
      <h1>Detection Dashboard</h1>
      <p>Monitor your recent animal detections.</p>
    </div>

    {detects.length === 0 ? (
      <div className="empty-detections">
        No detections found.
      </div>
    ) : (
      <div className="detection-grid">

        {detects.map((detect) => (
          <div className="detection-card" key={detect._id}>

            <div className="detection-photos">
              {detect.photos.map((photo, id) => (
                <img
                  key={id}
                  src={photo}
                  alt="Detection"
                />
              ))}
            </div>

            <div className="detection-info">

              <span className="detection-label">
                {detect.label}
              </span>

              <div className="detection-detail">
                <span>Confidence</span>
                <span>{detect.score}</span>
              </div>

              <div className="detection-detail">
                <span>Detected At</span>
                <span>{new Date(detect.detectedAt).toLocaleString()}</span>
              </div>

            

            </div>

          </div>
        ))}

      </div>
    )}

  </div>
);



    }




export default Dashboard 