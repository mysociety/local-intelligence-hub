from datetime import datetime
from typing import List, Optional

import strawberry

from .geojson import PointGeometry


@strawberry.type
class ElectoralCommissionParty:
    party_name: str
    party_id: str


@strawberry.type
class ElectoralCommissionPerson:
    name: str
    ynr_id: int


@strawberry.type
class ElectoralCommissionCandidate:
    # list_position: None
    party: ElectoralCommissionParty
    person: ElectoralCommissionPerson
    # previous_party_affiliations: None


@strawberry.type
class ElectoralCommissionVotingSystem:
    slug: str
    name: str
    uses_party_lists: bool


@strawberry.type
class ElectoralCommissionBallot:
    ballot_paper_id: str
    ballot_title: str
    poll_open_date: datetime = strawberry.field(resolver=lambda self: datetime.strptime(self.poll_open_date, "%Y-%m-%d"))
    elected_role: str
    metadata: None
    cancelled: bool
    cancellation_reason: None
    replaced_by: None
    replaces: None
    requires_voter_id: str
    election_id: str
    election_name: str
    post_name: str
    candidates_verified: bool
    candidates: List[ElectoralCommissionCandidate]
    voting_system: ElectoralCommissionVotingSystem
    seats_contested: int


@strawberry.type
class ElectoralCommissionStationProperties:
    postcode: str
    address: str


@strawberry.type
class ElectoralCommissionStation:
    type: str
    geometry: PointGeometry
    id: Optional[str] = None
    properties: Optional[ElectoralCommissionStationProperties] = None


@strawberry.type
class PollingStation:
    polling_station_known: bool
    custom_finder: None
    report_problem_url: str
    station: ElectoralCommissionStation


@strawberry.type
class ElectionDate:
    date: datetime = strawberry.field(resolver=lambda self: datetime.strptime(self.date, "%Y-%m-%d"))
    polling_station: PollingStation
    advance_voting_station: None
    ballots: List[ElectoralCommissionBallot]


@strawberry.type
class ElectoralServices:
    council_id: str
    name: str
    email: str
    phone: str
    website: str
    postcode: str
    address: str
    identifiers: List[str]
    nation: str


@strawberry.type
class ElectoralCommissionPostcodeLookup:
    address_picker: bool
    dates: List[ElectionDate]
    electoral_services: ElectoralServices
    registration: ElectoralServices
    postcode_location: ElectoralCommissionStation
    addresses: strawberry.scalars.JSON