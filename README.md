# View Revit files inside MapBox
View Revit models inside Mapbox, and click on Revit properties.

## DEMO: https://wallabyway.github.io/mapboxRevit/

<img src="https://user-images.githubusercontent.com/440241/65015225-beaaa980-d8d5-11e9-94ce-4876c628ac09.gif" width="100%">

### Notes

- Click on the model to view properties (via the Forge API. Alternatively, use props.db sqlite DB file instead)
- Use svf-extract to convert Revit file to glTF (see glTF folder)


### Bugs
- Currently the mapbox raycaster does not match correctly, so it cannot get the correct DBID from the gltf.node.name


![mapbox-static](https://user-images.githubusercontent.com/440241/65015291-ef8ade80-d8d5-11e9-99e9-d3a5d221f6ca.jpg)


### Other examples of MapBox with Revit data:

- Perkins-Will : http://research.perkinswill.com
- Archistar.AI : http://archistar.ai
- Ridley-Willow : https://www.willowinc.com

### References

- geo-location in LMV blog: https://forge.autodesk.com/blog/mini-map-geolocation-extension
- design Automation for Revit (rooms and Spaces): https://github.com/wallabyway/rooms-spaces-revit-plugin
- https://github.com/wallabyway/propertyServer/blob/master/pipeline.md

## Property SQLite Database usage

The demo is currently querying Forge service to retrieve meta-data given the dbID selected.

Alternatively, you can use the `props.db` sqlite database file, located in the folder `/gltf`.  Load the file in sqlite and query for properties associated with the dbID you click on.

### Example

We will replicate the property panel in Forge Viewer.

![properties](https://user-images.githubusercontent.com/440241/65016868-2a8f1100-d8da-11e9-9461-1f4905ca679b.jpg)

1. We selected the 'wall' and it's DBID is 2594.  I used `NOP_VIEWER.getSelection()` to get the value.


2. Now open props.db file in a SQLite browser.

3. To filter on `ids.id = 2594` use this SQL command:

```
select ids.external_id, attrs.name, attrs.category, attrs.data_type, vals.value from _objects_eav eavs
left join _objects_id ids on ids.id = eavs.entity_id 
left join _objects_attr attrs on attrs.id = eavs.attribute_id
left join _objects_val vals on vals.id = eavs.value_id where ids.id = 2594 order by eavs.entity_id
```

4.  This returns the results:

```
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	parent	__parent__	11	2107
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	instanceof_objid	__instanceof__	11	2107
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Level	__internalref__	11	5
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Location Line	Constraints	20	Wall Centerline
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Base Constraint	Constraints	20	Level 2
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Base Offset	Constraints	3	-500.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Base is Attached	Constraints	1	0.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Base Extension Distance	Constraints	3	0.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Top Constraint	Constraints	20	Up to level: Roof Line
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Unconnected Height	Constraints	3	3500.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Top Offset	Constraints	3	0.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Top is Attached	Constraints	1	0.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Top Extension Distance	Constraints	3	0.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Room Bounding	Constraints	1	1
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Related to Mass	Constraints	1	0.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Structural	Structural	1	0.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Enable Analytical Model	Structural	1	0.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Structural Usage	Structural	20	Non-bearing
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Length	Dimensions	3	19702.0
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Area	Dimensions	3	43.2957000000004
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Volume	Dimensions	3	8.15002486322177
c85e5be0-d8d5-4148-836f-b55e711ef373-00068ac9	Type Name	Identity Data	20	SIP 202mm Wall - conc clad

```

...and matches what's in the Forge viewer's property panel (see above).

Also note that the glTF converted files contain additional meta-data.

- the gltf node 'name' is a string version of the dbID
- the [metadata.json](https://github.com/wallabyway/mapboxRevit/blob/master/docs/gltf/output.metadata.json) file contains the Revit files [lat, long], which you can feed into Mapbox for positioning of the model.
