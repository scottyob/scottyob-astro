import type { Climb } from '@libs/Climbing';
import { $climbingFilterStore } from './stores';
import { useStore } from '@nanostores/react';
import { getFilteredData } from './ClimbingDataFilter';

export default function ClimbingTable(props: { data: Climb[] }) {
  // Filter the data given any page filters
  const filters = useStore($climbingFilterStore);
  const climbs = getFilteredData(props.data, filters);
  
  return (
    <table>
      <thead>
        <tr>
          <th>Number</th>
          <th>Date</th>
          <th>Type</th>
          <th>Rating</th>
          <th>Location</th>
          <th>Comments</th>
        </tr>
      </thead>
      <tbody>
        {climbs.map((climb) => (
          <tr key={climb.num}>
            <td>{climb.num}</td>
            <td>{climb.date}</td>
            <td>{climb.type}</td>
            <td>{climb.rating}</td>
            <td>{climb.location}</td>
            <td>{climb.comments}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
