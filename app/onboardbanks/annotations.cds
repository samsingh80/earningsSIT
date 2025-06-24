using configSrv as service from '../../srv/bank';
annotate service.Banks with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
           {
                $Type : 'UI.DataField',
                Value : name,
            },
            {
                $Type : 'UI.DataField',
                Value : descr,
            }

        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'code',
            Value : code,
        },
        {
            $Type : 'UI.DataField',
            Value : name,
        },

    ],
);


annotate service.Banks with @(UI.HeaderInfo: {
    Title         : {
        $Type: 'UI.DataField',
        Value: code,
    },
    TypeName      : 'Banks',
    TypeNamePlural: 'Banks',
    ![@UI.Hidden]: {$edmJson: {$Not: {$Path: 'IsActiveEntity'}}}
});