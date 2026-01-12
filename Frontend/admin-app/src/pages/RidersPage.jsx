import React from 'react';
import '../App.css';

const RidersPage = () => {
  return (
    <div className="container-fluid page-container">
      <div className="row">
        <div className="col-12">
          <h4 className="mb-3">Riders Management</h4>
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Rider ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="5" className="text-center">
                        Rider list functionality requires additional API endpoint
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RidersPage;
