import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BoostRequestsManagement.css';

const BoostRequestsManagement = () => {
  const [boostRequests, setBoostRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch all boost requests
  useEffect(() => {
    fetchBoostRequests();
  }, []);

  // Filter requests based on status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRequests(boostRequests);
    } else {
      const filtered = boostRequests.filter(req => req.status === statusFilter);
      setFilteredRequests(filtered);
    }
  }, [boostRequests, statusFilter]);

  const fetchBoostRequests = async () => {
    try {
      setLoading(true);
      console.log('📢 Fetching boost requests from /api/vehicles/boost/all');
      const response = await axios.get('/api/vehicles/boost/all', {
        params: { status: 'all', limit: 50, page: 1 }
      });
      console.log('✅ Response received:', response);
      console.log('✅ Response data:', response.data);
      console.log('✅ Boosts:', response.data.boosts);
      setBoostRequests(response.data.boosts || []);
    } catch (error) {
      console.error('❌ Error fetching boost requests:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      if (error.response?.data?.message) {
        alert('Failed to fetch boost requests: ' + error.response.data.message);
      } else {
        alert('Failed to fetch boost requests: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (boostId) => {
    try {
      const response = await axios.get(`/api/vehicles/boost/${boostId}`);
      setSelectedRequest(response.data.boost);
      setAdminNotes('');
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching boost details:', error);
      alert('Failed to fetch boost details');
    }
  };

  const handleApprove = async (boostId) => {
    if (!window.confirm('Are you sure you want to APPROVE this boost request?')) {
      return;
    }

    try {
      setActionInProgress(true);
      await axios.put(`/api/vehicles/boost/${boostId}/approve`, {});
      alert('Boost request approved successfully');
      setShowDetailModal(false);
      fetchBoostRequests();
    } catch (error) {
      console.error('Error approving boost:', error);
      alert('Failed to approve boost request');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async (boostId) => {
    if (!adminNotes.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }

    if (!window.confirm('Are you sure you want to REJECT this boost request?')) {
      return;
    }

    try {
      setActionInProgress(true);
      await axios.put(`/api/vehicles/boost/${boostId}/reject`, {
        adminNotes: adminNotes
      });
      alert('Boost request rejected successfully');
      setShowDetailModal(false);
      fetchBoostRequests();
    } catch (error) {
      console.error('Error rejecting boost:', error);
      alert('Failed to reject boost request');
    } finally {
      setActionInProgress(false);
    }
  };

  const getPackageLabel = (packageType) => {
    const packages = {
      'basic': 'Basic - 7 days',
      'standard': 'Standard - 14 days',
      'premium': 'Premium - 30 days'
    };
    return packages[packageType] || packageType;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      'credit_card': 'Credit Card',
      'bank_transfer': 'Bank Transfer',
      'paypal': 'PayPal',
      'cash': 'Cash'
    };
    return methods[method] || method;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'completed': return '#2196f3';
      default: return '#999';
    }
  };

  return (
    <div className="boost-management-container">
      <h2>Boost Requests Management</h2>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'pending', 'approved', 'rejected', 'completed'].map(status => (
          <button
            key={status}
            className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="count">({status === 'all' ? boostRequests.length : boostRequests.filter(r => r.status === status).length})</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && <p className="loading-text">Loading boost requests...</p>}

      {/* Requests List */}
      {!loading && (
        <>
          {filteredRequests.length === 0 ? (
            <p className="no-requests">No {statusFilter} boost requests found</p>
          ) : (
            <div className="requests-grid">
              {filteredRequests.map(request => (
                <div key={request._id} className="request-card" style={{ borderLeftColor: getStatusColor(request.status) }}>
                  <div className="request-header">
                    <h3>{request.vehicleId?.make} {request.vehicleId?.model} {request.vehicleId?.year}</h3>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(request.status) }}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="request-details">
                    <div className="detail-row">
                      <strong>User:</strong> {request.userId?.fullName} ({request.userId?.email})
                    </div>
                    <div className="detail-row">
                      <strong>Package:</strong> {getPackageLabel(request.packageType)}
                    </div>
                    <div className="detail-row">
                      <strong>Amount:</strong> Rs. {request.amount.toLocaleString()}
                    </div>
                    <div className="detail-row">
                      <strong>Payment:</strong> {getPaymentMethodLabel(request.paymentMethod)}
                    </div>
                    <div className="detail-row">
                      <strong>Contact:</strong> {request.contactPerson} - {request.contactPhone}
                    </div>
                    <div className="detail-row">
                      <strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="request-actions">
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetails(request._id)}
                    >
                      View Details
                    </button>
                    {request.status === 'pending' && (
                      <>
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(request._id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes('');
                            setShowDetailModal(true);
                          }}
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Boost Request Details</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Vehicle Info */}
              <div className="section">
                <h4>Vehicle Information</h4>
                {selectedRequest.vehicleId?.image && (
                  <img src={selectedRequest.vehicleId.image} alt="Vehicle" className="vehicle-image" />
                )}
                <div className="info-grid">
                  <div>
                    <strong>Make:</strong> {selectedRequest.vehicleId?.make}
                  </div>
                  <div>
                    <strong>Model:</strong> {selectedRequest.vehicleId?.model}
                  </div>
                  <div>
                    <strong>Year:</strong> {selectedRequest.vehicleId?.year}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedRequest.vehicleId?.type}
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="section">
                <h4>User Information</h4>
                <div className="info-grid">
                  <div>
                    <strong>Name:</strong> {selectedRequest.userId?.fullName}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedRequest.userId?.email}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedRequest.userId?.phone}
                  </div>
                </div>
              </div>

              {/* Boost Details */}
              <div className="section">
                <h4>Boost Details</h4>
                <div className="info-grid">
                  <div>
                    <strong>Package:</strong> {getPackageLabel(selectedRequest.packageType)}
                  </div>
                  <div>
                    <strong>Amount:</strong> Rs. {selectedRequest.amount.toLocaleString()}
                  </div>
                  <div>
                    <strong>Duration:</strong> {selectedRequest.duration} days
                  </div>
                  <div>
                    <strong>Start Date:</strong> {new Date(selectedRequest.startDate).toLocaleDateString()}
                  </div>
                </div>
                {selectedRequest.additionalNotes && (
                  <div className="notes">
                    <strong>Additional Notes:</strong>
                    <p>{selectedRequest.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* Payment Info */}
              <div className="section">
                <h4>Payment Information</h4>
                <div className="info-grid">
                  <div>
                    <strong>Method:</strong> {getPaymentMethodLabel(selectedRequest.paymentMethod)}
                  </div>
                  {selectedRequest.paymentMethod === 'credit_card' && (
                    <>
                      <div>
                        <strong>Card Holder:</strong> {selectedRequest.cardHolder}
                      </div>
                      <div>
                        <strong>Card:</strong> **** **** **** {selectedRequest.cardLast4}
                      </div>
                    </>
                  )}
                  {selectedRequest.paymentMethod === 'bank_transfer' && selectedRequest.bankSlipPath && (
                    <div>
                      <strong>Bank Slip:</strong>
                      <a href={selectedRequest.bankSlipPath} target="_blank" rel="noopener noreferrer" className="bank-slip-link">
                        View Bank Slip
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="section">
                <h4>Contact Information</h4>
                <div className="info-grid">
                  <div>
                    <strong>Contact Person:</strong> {selectedRequest.contactPerson}
                  </div>
                  <div>
                    <strong>Contact Phone:</strong> {selectedRequest.contactPhone}
                  </div>
                </div>
              </div>

              {/* Admin Notes Section */}
              {selectedRequest.status === 'pending' && (
                <div className="section reject-section">
                  <h4>Rejection Reason (if rejecting)</h4>
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Enter reason for rejection (required to reject)..."
                    rows="4"
                    className="admin-notes-textarea"
                  />
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div className="section">
                  <h4>Admin Notes</h4>
                  <p className="admin-notes-display">{selectedRequest.adminNotes}</p>
                </div>
              )}

              {selectedRequest.status === 'approved' && (
                <div className="section approval-info">
                  <h4>Approval Information</h4>
                  <div className="info-grid">
                    <div>
                      <strong>Approved By:</strong> {selectedRequest.approvedBy?.fullName || 'System Admin'}
                    </div>
                    <div>
                      <strong>Approval Date:</strong> {new Date(selectedRequest.approvalDate).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'rejected' && (
                <div className="section rejection-info">
                  <h4>Rejection Information</h4>
                  <div className="info-grid">
                    <div>
                      <strong>Rejected Date:</strong> {new Date(selectedRequest.rejectionDate).toLocaleString()}
                    </div>
                  </div>
                  {selectedRequest.adminNotes && (
                    <div className="notes">
                      <strong>Reason:</strong>
                      <p>{selectedRequest.adminNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    className="btn-approve-modal"
                    onClick={() => handleApprove(selectedRequest._id)}
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? 'Processing...' : '✓ Approve Request'}
                  </button>
                  <button
                    className="btn-reject-modal"
                    onClick={() => handleReject(selectedRequest._id)}
                    disabled={actionInProgress || !adminNotes.trim()}
                  >
                    {actionInProgress ? 'Processing...' : '✕ Reject Request'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoostRequestsManagement;
