import React from 'react';
import {Link, browserHistory} from 'react-router';
import 'react-tagsinput/react-tagsinput.css';
import './css/template-create.css';
import {
    Field,
    Fields,
    FormSection,
    FieldArray,
    reduxForm,
    formValueSelector,
    change,
    unregisterField,
    getFormValues,
    Form
} from 'redux-form'
import {connect} from "react-redux";
import {RenderWidget, WidgetList, PriceBreakdown, widgets} from "../../utilities/widgets";
import {WysiwygRedux} from "../../elements/wysiwyg.jsx";
import FileUploadForm from "./file-upload-form.jsx";
import {
    inputField,
    selectField,
    OnOffToggleField,
    iconToggleField,
    priceField,
    priceToCents
} from "./servicebot-base-field.jsx";
import {addAlert, dismissAlert} from "../../utilities/actions";
import ServiceBotBaseForm from "./servicebot-base-form.jsx";
import SVGIcons from "../../utilities/svg-icons.jsx";
import Load from "../../utilities/load.jsx";

let _ = require("lodash");
import {required, email, numericality, length} from 'redux-form-validators'
import slug from "slug"

const TEMPLATE_FORM_NAME = "serviceTemplateForm"
const selector = formValueSelector(TEMPLATE_FORM_NAME); // <-- same as form name


function renderSplits({fields, meta: {error, submitFailed}}) {

    function onAdd(e) {
        e.preventDefault();
        let number_of_payments = e.target.value
        let number_of_fields = fields.length

        while (number_of_fields < number_of_payments) {
            fields.push({});
            number_of_fields++;
        }
        while (number_of_fields > number_of_payments) {
            fields.pop()
            number_of_fields--;
        }
        return (fields);

    }


    return (
        <div>
            <div className="form-group form-group-flex">
                <lable className="control-label form-label-flex-md">Number of payments</lable>
                <div className="form-input-flex">
                    <input className="form-control" type="number" defaultValue={fields.length} onChange={onAdd}/>
                    {submitFailed && error && <span>{error}</span>}
                </div>
            </div>

            <ul className="split-payment-items">
                {fields.map((member, index) => (
                    <li className="split-payment-item" key={index}>
                        <button className="btn btn-rounded custom-field-button iconToggleField"
                                id="split-payment-delete-button" onClick={() => fields.remove(index)}
                                type="button" title="Remove Payment"><span className="itf-icon"><i
                            className="fa fa-close"/></span></button>

                        <h4>Payment #{index + 1}</h4>
                        <label>Days to charge customer after subscribed</label>
                        <Field
                            name={`${member}.charge_day`}
                            type="number"
                            component={inputField}
                            validate={numericality({'>=': 0.00})}

                        />
                        <Field name={`${member}.amount`} type="number"
                               component={priceField}
                               isCents={true}
                               label="Amount"
                               validate={numericality({'>=': 0.00})}
                        />
                    </li>
                ))}
            </ul>
        </div>
    )
}


class CustomField extends React.Component {

    constructor(props) {
        super(props);

    }

    componentWillReceiveProps(nextProps) {
        let props = this.props;
        if (nextProps.myValues.type !== props.myValues.type) {
            props.clearConfig();
            props.clearValue();
        }
        if ((props.templateType && nextProps.templateType !== props.templateType)) {
            props.clearPricing();
        }
    }

    render() {

        let props = this.props;
        let {
            willAutoFocus, index, typeValue, member, myValues, privateValue, requiredValue, promptValue, configValue,
            setPrivate, setRequired, setPrompt, changePrivate, changeRequired, changePrompt, templateType
        } = props;
        let machineName;

        if (myValues.prop_label) {
            willAutoFocus = false;
            machineName = slug(myValues.prop_label, {lower: true});

        }
        return (
            <div className="custom-property-fields">
                <div id="custom-prop-name" className="custom-property-field-group">
                    <Field
                        willAutoFocus={willAutoFocus}
                        name={`${member}.prop_label`}
                        type="text"
                        component={inputField}
                        validate={required()}
                        placeholder="Custom Property Label"
                    />
                </div>

                <div id="custom-prop-type" className="custom-property-field-group">
                    <WidgetList name={`${member}.type`} id="type"/>
                </div>

                <div id="custom-prop-settings" className="custom-property-field-group">
                    {!privateValue && !requiredValue &&
                    <Field
                        onChange={changePrompt}
                        setValue={setPrompt}
                        name={`${member}.prompt_user`}
                        type="checkbox"
                        label={promptValue ? "Prompt User" : "Set Prompt User"}
                        defaultValue={true}
                        color="#0091EA"
                        faIcon="eye"
                        component={iconToggleField}
                    />
                    }
                    {!privateValue &&
                    <Field
                        onChange={changeRequired}
                        setValue={setRequired}
                        name={`${member}.required`}
                        type="checkbox"
                        label={requiredValue ? "Required" : "Set Required"}
                        color="#FF1744"
                        faIcon="check"
                        component={iconToggleField}
                    />
                    }
                    {!requiredValue && !promptValue &&
                    <Field
                        onChange={changePrivate}
                        setValue={setPrivate}
                        name={`${member}.private`}
                        type="checkbox"
                        label={privateValue ? "Private" : "Set Private"}
                        color="#424242"
                        faIcon="hand-paper-o"
                        component={iconToggleField}
                    />
                    }
                </div>
                <div id="custom-prop-widget" className="custom-property-field-group">
                    {machineName &&
                    <div className="form-group form-group-flex addon-options-widget-config-input-wrapper">
                        <label className="control-label form-label-flex-md addon-options-widget-config-input-label">Machine
                            Name</label>
                        <pre>{machineName}</pre>
                    </div>}
                    {typeValue && <RenderWidget
                        showPrice={(templateType !== "custom" && templateType !== "split")}
                        member={member}
                        configValue={configValue}
                        widgetType={typeValue}/>
                    }
                </div>
            </div>
        )
    };
}

CustomField = connect((state, ownProps) => {
    return {
        "privateValue": selector(state, "references.service_template_properties")[ownProps.index].private,
        "requiredValue": selector(state, "references.service_template_properties")[ownProps.index].required,
        "promptValue": selector(state, "references.service_template_properties")[ownProps.index].prompt_user,
        "typeValue": selector(state, "references.service_template_properties")[ownProps.index].type,
        "configValue": selector(state, `references.service_template_properties`)[ownProps.index].config,
        "myValues": selector(state, `references.${ownProps.member}`),


    }
}, (dispatch, ownProps) => {
    return {
        "setPrivate": (val) => {
            if (val == true) {
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, true));
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.required`, false));
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, false));
            } else {
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, false));
            }
        },
        "setRequired": (val) => {
            if (val == true) {
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.required`, true));
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, false));
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, true));
            } else {
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.required`, false));
            }
        },
        "setPrompt": (val) => {
            if (val == true) {
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, true));
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, false));
            } else {
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, false));
            }
        },
        "changePrivate": (event) => {
            if (!event.currentTarget.value || event.currentTarget.value == 'false') {
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.required`, false));
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, false));
            }
        },
        "changeRequired": (event) => {
            if (!event.currentTarget.value || event.currentTarget.value == 'false') {
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, false));
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, true));
            }
        },
        "changePrompt": (event) => {
            if (!event.currentTarget.value || event.currentTarget.value == 'false') {
                dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, false));
            }
        },
        "clearConfig": () => {
            dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.config`, {}));
        },
        "clearPricing": () => {
            dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.config.pricing`, null));
        },
        "clearValue": () => {
            dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.data`, null));
        }
    }
})(CustomField);


//Custom property
class renderCustomProperty extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            customFields: [],
        };


        this.onAdd = this.onAdd.bind(this);
    }

    onAdd(e) {
        e.preventDefault();
        const {privateValue, fields, meta: {touched, error}} = this.props;
        return (fields.push({}));
    }

    render() {
        let props = this.props;
        const {templateType, privateValue, fields, meta: {touched, error}} = props;
        return (
            <div>
                <ul className="custom-fields-list">
                    {fields.map((customProperty, index) =>
                        <li className="custom-field-item" key={index}>
                            <div className="custom-field-name">
                                {/*{fields.get(index).prop_label ?*/}
                                {/*<p>{fields.get(index).prop_label}</p> : <p>Field #{index + 1}</p>*/}
                                {/*}*/}
                                <button className="btn btn-rounded custom-field-button iconToggleField"
                                        id="custom-field-delete-button"
                                        type="button"
                                        title="Remove Field"
                                        onClick={() => fields.remove(index)}>
                                    <span className="itf-icon"><i className="fa fa-close"/></span>
                                </button>
                            </div>
                            <CustomField templateType={templateType} member={customProperty} index={index}
                                         willAutoFocus={fields.length - 1 == index}/>
                        </li>
                    )}
                    <li className="custom-field-item">
                        <div className="form-group form-group-flex">
                            <input className="form-control custom-property-add-field-toggle" autoFocus={false}
                                   placeholder="Add Custom Field ..." onClick={this.onAdd}/>
                        </div>
                        {/*<button className="btn btn-rounded" type="button" onClick={this.onAdd}>Add Field</button>*/}
                        {touched && error && <span>{error}</span>}
                    </li>
                </ul>
            </div>
        )
    };
}


//The full form
let PaymentStructureTemplates = function (props) {
    let {fields, tier, member, setPricingTemplates} = props;
    let plans = fields.getAll() || [];

    function addPayment(e) {
        e.preventDefault();
        fields.push({
            interval_count: 1,
            trial_period_days: tier.trial_period_days || 0,
            type: tier.type,
            // statement_descriptor: this.props.company_name.value.substring(0, 22),
            amount: 0

        });
    };

    function deletePlan(index) {
        return (e) => {
            e.preventDefault();
            fields.remove(index)
        }
    }


    let availableOptions = [
        {id: "month", name: "Month"},
        {id: "year", name: "Year"},
        {id: "day", name: "Day"},
        {id: "week", name: "Week"}
    ];
    let optionMap = plans.map(plan => {
        return availableOptions.filter(option => option.id === plan.interval || !plans.some(plan2 => plan2.interval === option.id));
    });
    // ].filter(option => {
    //     return !plans.some(plan => plan.interval === option.id);
    // });
    if (tier.type === "custom") {
        return (<div>
            <p>Quotes are built for services that are customer specific. If your service is
                priced
                based on the customer's use-case, use this option. Once the quote service has
                been
                requested by the customer, you can add charges to the service at anytime.
            </p>
        </div>);

    }
    if (tier.type === "one_time") {
        let field = fields[0];
        return (<Field name={field + ".amount"} type="number"
                       component={priceField}
                       isCents={true}
                       label="Amount"
                       validate={numericality({'>=': 0.00})}/>);

    }
    if (tier.type === "subscription") {
        return (<div className="payment-structures">
            {fields.map((field, index) => {
                return (<div key={"field-" + index + "-" + member}>
                    <label className="control-label form-label-flex-md" htmlFor="type">Bill Customer Every</label>
                    <Field name={field + ".interval"} id="interval" component={selectField}
                           options={optionMap[index]}/>
                    <Field name={field + ".amount"} type="number"
                           component={priceField}
                           isCents={true}
                           label="Amount"
                           validate={numericality({'>=': 0.00})}/>
                    {fields.length > 1 && <button onClick={deletePlan(index)}>Delete</button>}
                </div>)
            })}

            {plans.length < 4 && <button onClick={addPayment}>Add</button>}
        </div>)
    } else {
        return <div></div>
    }
}


let TierBillingForm = function (props) {
    let {tier, member, setPricingTemplates, serviceTypeValue} = props;
    const changeServiceType = (event, newValue) => {
        let pricingStructures = (tier.references && tier.references.payment_structure_templates) || [];
        setPricingTemplates(member, pricingStructures.map(p => {
            return {
                ...p,
                type: newValue
            }
        }));
    };
    const changeTrial = (event, newValue) => {
        let pricingStructures = (tier.references && tier.references.payment_structure_templates) || [];
        setPricingTemplates(member, pricingStructures.map(p => {
            return {
                ...p,
                trial_period_days: newValue
            }
        }));
    };

    const formatFromPricing = (value, name) => {
        console.log("VAL", value);
        let pricingStructures = (tier.references && tier.references.payment_structure_templates) || [];
        if((value === null || value === undefined) && pricingStructures.length > 0){
            return pricingStructures[0][name];
        }
        return value;
    };


    return (<div>
        <Field name={member + ".name"} type="text"
               component={inputField} label="Tier Name (eg. Basic, Enterprise)"
               validate={[required()]}
        />

        <Field name={member + ".type"} id="type"
               component={selectField} label="Billing Type" onChange={changeServiceType}
               options={[
                   {id: "subscription", name: "Subscription"},
                   // {id: "split", name: "Scheduled Payments"},
                   {id: "one_time", name: "One Time"},
                   {id: "custom", name: "Quote"}
               ]}
        />

        {tier.type === "subscription" &&
        <Field onChange={changeTrial} format={formatFromPricing} name={member + ".trial_period_days"} type="number"
               component={inputField} label="Trial Period (Days)"
               validate={required()}
        />}


        <FormSection name={member + ".references"}>
            <FieldArray name="payment_structure_templates"
                        props={{tier: tier, member: member}}
                        component={PaymentStructureTemplates}/>
        </FormSection>
    </div>)
}

let Tiers = function (props) {
    let {member, fields, selected, selectTier, overrideBilling, setPricingTemplate} = props;
    selectTier = selectTier || (() => {
    });
    let current = fields.get(selected);

    function deleteTier(index) {
        return (e) => {
            e.preventDefault();
            selectTier(0)(e);
            fields.remove(index)
        }
    }

    function onAdd(e) {
        e.preventDefault();
        selectTier(fields.length)()
        return fields.push({
            references: {
                payment_structure_templates: [{
                    trial_period_days: 0,
                    amount: 0,
                    type:"subscription",
                    interval: "month",
                    interval_count: 1
                }]
            },
            name: "Tier " + (fields.length + 1),
            trial_period_days: 0,
            amount: 0,
            type:"subscription"
        });
    }

    return (<div>
        <ul>
            {fields.map((field, index) => {
                let liClass = "tier"
                let tier = fields.get(index);
                if (index === selected) {
                    liClass = liClass + " selected";

                }
                return (<li key={"tier-" + index} className={liClass} id={"tier-" + index}>
                    {fields.length > 1 && <button onClick={deleteTier(index)}>Delete Tier</button>}
                    <div onClick={selectTier(index)}>
                        <h2 className={"tier-name"}>{tier.name}</h2>
                        <div className={"tier-preview"}>
                        </div>
                    </div>
                </li>)
            })}
            <li id={"add-tier"} onClick={onAdd}>
                <span>ADD</span>
            </li>

        </ul>
        <TierBillingForm {...props} member={"tiers[" + selected + "]"} tier={current}/>
    </div>)

};
Tiers = connect((state, ownProps) => {
    return {
        // "privateValue": selector(state, "references.service_template_properties")[ownProps.index].private,
        // "requiredValue": selector(state, "references.service_template_properties")[ownProps.index].required,
        // "promptValue": selector(state, "references.service_template_properties")[ownProps.index].prompt_user,
        // "typeValue": selector(state, "references.service_template_properties")[ownProps.index].type,
        // "configValue": selector(state, `references.service_template_properties`)[ownProps.index].config,
        // "tiers": selector(state, `references.tiers`)


    }
}, (dispatch, ownProps) => {
    return {
        "setPricingTemplates": (member, val) => {
            dispatch(change(TEMPLATE_FORM_NAME, `references.${member}.references.payment_structure_templates`, val));
        },
        // "setRequired": (val) => {
        //     if (val == true) {
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.required`, true));
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, false));
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, true));
        //     } else {
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.required`, false));
        //     }
        // },
        // "setPrompt": (val) => {
        //     if (val == true) {
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, true));
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, false));
        //     } else {
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, false));
        //     }
        // },
        // "changePrivate": (event) => {
        //     if (!event.currentTarget.value || event.currentTarget.value == 'false') {
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.required`, false));
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, false));
        //     }
        // },
        // "changeRequired": (event) => {
        //     if (!event.currentTarget.value || event.currentTarget.value == 'false') {
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, false));
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.prompt_user`, true));
        //     }
        // },
        // "changePrompt": (event) => {
        //     if (!event.currentTarget.value || event.currentTarget.value == 'false') {
        //         dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.private`, false));
        //     }
        // },
        // "clearConfig": () => {
        //     dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.config`, {}));
        // },
        // "clearPricing": () => {
        //     dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.config.pricing`, null));
        // },
        // "clearValue": () => {
        //     dispatch(change(TEMPLATE_FORM_NAME, `references.${ownProps.member}.data`, null));
        // }
    }
})(Tiers);


class TemplateForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedTier: 0
        };
        this.selectTier = this.selectTier.bind(this)
    }

    selectTier(index) {
        let self = this;
        return (event) => {
            self.setState({
                selectedTier: index
            });
        }
    }

    render() {
        let self = this;
        let props = this.props;

        const changeServiceType = (event, newValue) => {
            if (newValue === 'one_time') {
                props.setIntervalCount();
                props.setInterval();
            }
            else if (newValue === 'custom' || newValue === 'split') {
                props.setIntervalCount();
                props.setInterval();
                props.clearAmount();
            }
        };


        const {handleSubmit, pristine, reset, submitting, error, serviceTypeValue, invalid, formJSON, options} = props;

        const sectionDescriptionStyle = {
            background: _.get(options, 'service_template_icon_background_color.value', '#000000'),
            height: "100px",
            width: "100px",
            padding: "30px",
            marginLeft: "50%",
            transform: "translateX(-50%)",
            borderRadius: "50%",
        };

        return (

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-8">
                        <div className="form-level-errors">
                            {!options.stripe_publishable_key &&
                            <Link to="/stripe-settings"><br/><h4 className="form-error">Publishing Disabled Until Setup
                                Complete - Click here to complete</h4></Link>}
                            {error && <div className="form-error">{error}</div>}
                        </div>
                        <div className="form-level-warnings"/>
                        <h3>Service Info</h3>
                        <Field name="name" type="text"
                               component={inputField} label="Product / Service Name"
                               validate={[required()]}
                        />

                    </div>

                </div>
                <div className="row">
                    <div className="col-md-12">
                        <hr/>
                        <div className="row">
                            <div className="col-md-8">
                                <h3>Tiers</h3>
                                <Field name="statement_descriptor" type="hidden"
                                       component={inputField} label="Statement Descriptor"
                                />
                                <div>
                                    <FormSection name="references">
                                        <FieldArray name="tiers"
                                                    props={{
                                                        selected: self.state.selectedTier,
                                                        selectTier: self.selectTier,
                                                        templateType: serviceTypeValue
                                                    }}
                                                    component={Tiers}/>
                                    </FormSection>
                                </div>

                                {/*{(serviceTypeValue === 'split') &&*/}
                                {/*<div>*/}

                                {/*<FormSection name="split_configuration">*/}
                                {/*<FieldArray name="splits"*/}
                                {/*props={{templateType: serviceTypeValue}}*/}
                                {/*component={renderSplits}/>*/}

                                {/*</FormSection>*/}

                                {/*</div>*/}
                                {/*}*/}

                            </div>


                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12">
                        <hr/>
                        <div className="row">
                            <div className="col-md-8">
                                {/*<h3>Custom Fields</h3>*/}
                                {/*<FormSection name="references">*/}
                                {/*<FieldArray name="service_template_properties"*/}
                                {/*props={{templateType: serviceTypeValue}}*/}
                                {/*component={renderCustomProperty}/>*/}
                                {/*</FormSection>*/}
                                {/*{props.formJSON.references && props.formJSON.references.service_template_properties &&*/}
                                {/*<PriceBreakdown*/}
                                {/*inputs={props.formJSON.references.service_template_properties}/>*/}
                                {/*}*/}
                                <div id="service-submission-box" className="button-box right">
                                    <Link className="btn btn-rounded btn-default" to={'/manage-catalog/list'}>Go
                                        Back</Link>
                                    <button className="btn btn-rounded btn-primary" type="submit">
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        )
    };
}


class ServiceTemplateForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            newTemplateId: 0,
            success: false,
            imageSuccess: false,
            iconSuccess: false
        };
        this.handleResponse = this.handleResponse.bind(this);
        this.handleImageSuccess = this.handleImageSuccess.bind(this);
        this.handleIconSuccess = this.handleIconSuccess.bind(this);
        this.submissionPrep = this.submissionPrep.bind(this);
    }

    handleImageSuccess() {
        this.setState({
            imageSuccess: true
        });
    }

    handleIconSuccess() {
        this.setState({
            iconSuccess: true
        });
    }

    handleResponse(response) {
        this.setState({
            newTemplateId: response.id,
            success: true
        });
        let successMessage = {
            id: Date.now(),
            alertType: 'success',
            message: `${response.name} was saved successfully`,
            show: true,
            autoDismiss: 4000,
        };
        this.props.addAlert(successMessage);
        browserHistory.push(`/manage-catalog/list`);
    }

    submissionPrep(values) {
        //remove id's for duplicate template operation
        if (this.props.params.duplicate) {
            console.log("We have a duplicate and we want to remove id");
            delete values.id;
            values.references.service_template_properties = values.references.service_template_properties.map(prop => {
                if (prop.id) {
                    delete prop.id;
                }
                return prop;
            })
            values.references.tiers = values.references.tiers.map(tier => {
                if (tier.id) {
                    delete tier.id;
                }
                if(tier.references && tier.references.payment_structure_templates){
                    tier.references.payment_structure_templates = tier.references.payment_structure_templates.map(pay => {
                        if(pay.id){
                            delete pay.id;
                        }
                        return pay;
                    })
                }
                return tier;
            })

        }
        return values;
    }

    render() {
        //Todo change this. this is how we are currently making sure the redux store is populated
        if (!this.props.company_name) {
            return (<Load/>);
        } else {
            let templateId = this.props.params.templateId;
            let initialValues = {};
            let initialRequests = [];
            let submissionRequest = {};
            let successMessage = "Template Updated";
            let imageUploadURL = `/api/v1/service-templates/${this.state.newTemplateId}/image`;
            let iconUploadURL = `/api/v1/service-templates/${this.state.newTemplateId}/icon`;
            function initializer(values){
                if(templateId){
                    values.references.tiers = (values._tiers || []).map(tier => {
                        let paymentPlans = tier.references.payment_structure_templates;
                        if(paymentPlans && paymentPlans.length > 0){
                            return {
                                ...tier,
                                trial_period_days: paymentPlans[0].trial_period_days,
                                type: paymentPlans[0].type
                            }
                        }else{
                            return tier;
                        }
                    });
                }
                return values;
            }
            if (templateId) {
                initialRequests.push({
                        'method': 'GET',
                        'url': `/api/v1/service-templates/${templateId}`
                    },
                    {'method': 'GET', 'url': `/api/v1/tiers/search?key=service_template_id&value=${templateId}`, 'name': '_tiers'},
                    {'method': 'GET', 'url': `/api/v1/service-categories`, 'name': '_categories'},
                );
                if (this.props.params.duplicate) {
                    submissionRequest = {
                        'method': 'POST',
                        'url': `/api/v1/service-templates`
                    };
                    successMessage = "Template Duplicated";
                }
                else {
                    submissionRequest = {
                        'method': 'PUT',
                        'url': `/api/v1/service-templates/${templateId}`
                    };
                    successMessage = "Template Updated";
                    imageUploadURL = `/api/v1/service-templates/${templateId}/image`;
                    iconUploadURL = `/api/v1/service-templates/${templateId}/icon`;
                }
            }
            else {
                initialValues = {
                    category_id: 1,
                    interval: 'month',
                    published: !!this.props.fieldState.options.stripe_publishable_key,
                    references: {
                        tiers: [
                            {
                                trial_period_days: 0,
                                references: {
                                    payment_structure_templates: [{
                                        interval: 'month',
                                        interval_count: 1,
                                        trial_period_days: 0,
                                        type: 'subscription',
                                        amount: 0
                                    }
                                    ]
                                }, name: "Tier 1"
                            }
                        ]
                    }
                };
                initialRequests.push(
                    {'method': 'GET', 'url': `/api/v1/service-categories`, 'name': '_categories'},
                );
                submissionRequest = {
                    'method': 'POST',
                    'url': `/api/v1/service-templates`
                };
                successMessage = "Template Created";
            }

            return (
                <div>
                    <div className="row">
                        <div className="col-md-3">
                            {/*{(!this.state.imageSuccess || !this.state.iconSuccess || !this.state.success) &&*/}
                            {/*<div>*/}

                            {/*<FileUploadForm*/}
                            {/*upload={this.state.success}*/}
                            {/*imageUploadURL={imageUploadURL}*/}
                            {/*name="template-image"*/}
                            {/*label="Upload Cover Image"*/}
                            {/*handleImageUploadSuccess={this.handleImageSuccess}*/}
                            {/*/>*/}
                            {/*<FileUploadForm*/}
                            {/*upload={this.state.success}*/}
                            {/*imageUploadURL={iconUploadURL}*/}
                            {/*name="template-icon"*/}
                            {/*label="Upload Icon Image"*/}
                            {/*handleImageUploadSuccess={this.handleIconSuccess}*/}
                            {/*/>*/}
                            {/*</div>*/}
                            {/*}*/}
                        </div>
                        <div className="col-md-9">
                            <ServiceBotBaseForm
                                form={TemplateForm}
                                formName={TEMPLATE_FORM_NAME}
                                initialValues={initialValues}
                                initialRequests={initialRequests}
                                submissionPrep={this.submissionPrep}
                                submissionRequest={submissionRequest}
                                successMessage={successMessage}
                                handleResponse={this.handleResponse}
                                initializer={initializer}
                                formProps={{
                                    ...this.props.fieldDispatches,
                                    ...this.props.fieldState
                                }}
                            />
                        </div>
                    </div>
                </div>
            )
        }
    }
}

function mapStateToProps(state) {
    return {
        alerts: state.alerts,
        company_name: state.options.company_name,
        fieldState: {
            "options": state.options,
            "serviceTypeValue": selector(state, `type`),
            formJSON: getFormValues(TEMPLATE_FORM_NAME)(state),
        },
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        addAlert: (alert) => {
            return dispatch(addAlert(alert))
        },
        dismissAlert: (alert) => {
            return dispatch(dismissAlert(alert))
        },
        fieldDispatches: {
            'setIntervalCount': () => {
                dispatch(change(TEMPLATE_FORM_NAME, `interval_count`, 1))
            },
            'setInterval': () => {
                dispatch(change(TEMPLATE_FORM_NAME, `interval`, 'day'))
            },
            'clearAmount': () => {
                dispatch(change(TEMPLATE_FORM_NAME, `amount`, 0))
            }
        }

    }
};

export default connect(mapStateToProps, mapDispatchToProps)(ServiceTemplateForm);