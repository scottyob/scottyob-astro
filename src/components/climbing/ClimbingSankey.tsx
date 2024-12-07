import type { Climb } from "@libs/Climbing";
import { ResponsiveSankey } from '@nivo/sankey';
import { $climbingFilterStore } from './stores';
import { useStore } from '@nanostores/react';
import { getFilteredData } from './ClimbingDataFilter';


export default function ClimbingSankey(props: { climbs: Climb[] }) {

    // Filter the data given any page filters
    const filters = useStore($climbingFilterStore);
    const climbs = getFilteredData(props.climbs, filters);

    const uniqueRatings = Array.from(new Set(climbs.map(climb => climb.rating)));


    const data = {
        nodes: [
            {
                id: 'TotalClimbs',
            },
            {
                id: 'Bouldering',
            },
            {
                id: 'TopRoping',
            },
            ...uniqueRatings.map(rating => ({ id: rating })),

        ],
        links: [
            {
                source: 'TotalClimbs',
                target: 'Bouldering',
                value: climbs.filter(c => c.type == "Bouldering").length
            },
                {
                    source: 'TotalClimbs',
                    target: 'TopRoping',
                    value: climbs.filter(c => c.type == "TopRoping").length
                },
                ...uniqueRatings.flatMap(rating => [
                    {
                        source: "Bouldering",
                        target: rating,
                        value: climbs.filter(c => c.type === "Bouldering" && c.rating === rating).length,
                    },
                    {
                        source: "TopRoping",
                        target: rating,
                        value: climbs.filter(c => c.type === "TopRoping" && c.rating === rating).length,
                    },
                ]).filter(link => link.value > 0),
        ],
    };

    return <ResponsiveSankey
        data={data}
        layout="vertical"
        margin={{ top: 40, right: 10, bottom: 10, left: 50 }}
        align="justify"
        colors={{ scheme: 'category10' }}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderColor={{
            from: 'color',
            modifiers: [['darker', 0.8]],
        }}
        nodeBorderRadius={3}
        linkOpacity={0.5}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="vertical"
        labelPadding={16}
        labelTextColor={{
            from: 'color',
            modifiers: [['darker', 1]],
        }}
    />;
}
